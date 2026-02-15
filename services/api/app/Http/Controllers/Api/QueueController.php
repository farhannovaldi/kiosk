<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Counter;
use App\Models\Queue;
use App\Models\Service;
use App\Models\Visitor;
use App\Services\TicketPrinter;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class QueueController extends Controller
{
    public function displayBoard()
    {
        $today = now()->toDateString();

        $counters = Counter::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $result = $counters->map(function (Counter $counter) use ($today) {
            $assigned = $counter->assigned_services ?? [];

            if (count($assigned) === 0) {
                return [
                    'counter' => [
                        'id' => $counter->id,
                        'name' => $counter->name,
                    ],
                    'current' => null,
                    'waiting_count' => 0,
                ];
            }

            $current = Queue::query()
                ->whereIn('service_id', $assigned)
                ->whereIn('status', ['called', 'serving'])
                ->where('queue_date', $today)
                ->orderByDesc('called_at')
                ->orderByDesc('updated_at')
                ->first();

            $waitingCount = Queue::query()
                ->whereIn('service_id', $assigned)
                ->where('status', 'waiting')
                ->where('queue_date', $today)
                ->count();

            return [
                'counter' => [
                    'id' => $counter->id,
                    'name' => $counter->name,
                ],
                'current' => $current?->load('service'),
                'waiting_count' => $waitingCount,
            ];
        })->values();

        return response()->json([
            'date' => $today,
            'updated_at' => now()->toIso8601String(),
            'counters' => $result,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'visitor_token' => ['nullable', 'string', 'max:255'],
            'visitor_nik' => ['nullable', 'string', 'max:32'],
            'visitor_name' => ['nullable', 'string', 'max:255'],
            'face_capture_base64' => ['nullable', 'string', 'max:4000000'],
        ]);

        $visitorToken = isset($validated['visitor_token']) ? trim($validated['visitor_token']) : null;
        $visitorNik = isset($validated['visitor_nik']) ? trim($validated['visitor_nik']) : null;
        $visitorName = isset($validated['visitor_name']) ? trim($validated['visitor_name']) : null;
        $faceCaptureBase64 = isset($validated['face_capture_base64']) ? trim($validated['face_capture_base64']) : null;

        if (! $visitorToken && ! $visitorNik) {
            return response()->json([
                'message' => 'NIK atau token warga wajib diisi.',
            ], 422);
        }

        $service = Service::query()
            ->where('id', $validated['service_id'])
            ->where('is_active', true)
            ->firstOrFail();

        $payload = DB::transaction(function () use ($service, $visitorToken, $visitorNik, $visitorName) {
            $visitor = null;
            $isNewVisitor = false;

            if ($visitorToken) {
                $visitor = Visitor::query()
                    ->where('qr_code_string', $visitorToken)
                    ->first();

                if (! $visitor) {
                    abort(response()->json([
                        'message' => 'Token warga tidak ditemukan.',
                    ], 404));
                }
            } else {
                $visitor = Visitor::query()
                    ->where('nik', $visitorNik)
                    ->first();

                if (! $visitor) {
                    if (! $visitorName) {
                        abort(response()->json([
                            'message' => 'Nama wajib diisi untuk warga baru.',
                        ], 422));
                    }

                    $visitor = Visitor::create([
                        'nik' => $visitorNik,
                        'name' => $visitorName,
                        'qr_code_string' => 'VT-'.strtoupper(Str::random(12)),
                    ]);
                    $isNewVisitor = true;
                } elseif ($visitorName && $visitor->name !== $visitorName) {
                    $visitor->update([
                        'name' => $visitorName,
                    ]);
                }
            }

            $queueDate = now()->toDateString();
            $lastQueue = Queue::query()
                ->where('service_id', $service->id)
                ->where('queue_date', $queueDate)
                ->orderByDesc('ticket_number')
                ->lockForUpdate()
                ->first();

            $nextNumber = $lastQueue ? $lastQueue->ticket_number + 1 : 1;
            $ticketCode = $service->code.'-'.str_pad((string) $nextNumber, 3, '0', STR_PAD_LEFT);

            $queue = Queue::create([
                'service_id' => $service->id,
                'visitor_id' => $visitor?->id,
                'queue_date' => $queueDate,
                'ticket_number' => $nextNumber,
                'ticket_code' => $ticketCode,
                'status' => 'waiting',
            ]);

            $waitingCount = Queue::query()
                ->where('service_id', $service->id)
                ->where('queue_date', $queueDate)
                ->where('status', 'waiting')
                ->count();

            return [
                'queue' => $queue,
                'waiting_count' => $waitingCount,
                'visitor' => $visitor,
                'is_new_visitor' => $isNewVisitor,
            ];
        });

        $queue = $payload['queue']->load(['service', 'visitor']);

        if ($faceCaptureBase64) {
            try {
                $facePath = $this->storeFaceCapture($queue, $faceCaptureBase64);
                if ($facePath) {
                    $queue->update(['face_capture_path' => $facePath]);
                    $queue->face_capture_path = $facePath;
                }
            } catch (\Throwable $exception) {
                logger()->warning('Face capture save failed.', [
                    'queue_id' => $queue->id,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        try {
            $printer = app(TicketPrinter::class);
            $printer->printTicket($queue, $payload['waiting_count']);

            if ($payload['is_new_visitor']) {
                $printer->printVisitorCard($queue);
            }
        } catch (\Throwable $exception) {
            logger()->error('Ticket printing failed.', [
                'queue_id' => $queue->id,
                'error' => $exception->getMessage(),
            ]);
        }

        return response()->json([
            'queue' => $queue,
            'waiting_count' => $payload['waiting_count'],
            'visitor' => $payload['visitor'],
            'is_new_visitor' => $payload['is_new_visitor'],
        ], 201);
    }

    public function callNext(Request $request)
    {
        $validated = $request->validate([
            'counter_id' => ['required', 'integer', 'exists:counters,id'],
        ]);

        $counter = Counter::findOrFail($validated['counter_id']);
        $assigned = $counter->assigned_services ?? [];

        if (count($assigned) === 0) {
            return response()->json(['message' => 'Counter has no assigned services.'], 422);
        }

        // Check if there's already a queue being called or served
        $currentQueue = Queue::query()
            ->whereIn('status', ['called', 'serving'])
            ->whereIn('service_id', $assigned)
            ->where('queue_date', now()->toDateString())
            ->first();

        if ($currentQueue) {
            return response()->json([
                'message' => 'Selesaikan atau lewati antrean saat ini terlebih dahulu.',
                'current_queue' => $currentQueue->ticket_code,
            ], 422);
        }

        $queue = Queue::query()
            ->where('status', 'waiting')
            ->whereIn('service_id', $assigned)
            ->where('queue_date', now()->toDateString())
            ->orderBy('created_at')
            ->first();

        if (! $queue) {
            return response()->json(['message' => 'No waiting queue found.'], 404);
        }

        $queue->update([
            'status' => 'called',
            'called_at' => now(),
        ]);

        return response()->json($queue->load('service'));
    }

    public function callSpecific(Request $request, Queue $queue)
    {
        $validated = $request->validate([
            'counter_id' => ['required', 'integer', 'exists:counters,id'],
        ]);

        $counter = Counter::findOrFail($validated['counter_id']);
        $assigned = $counter->assigned_services ?? [];

        if (count($assigned) === 0) {
            return response()->json(['message' => 'Counter has no assigned services.'], 422);
        }

        if (! in_array($queue->service_id, $assigned, true)) {
            return response()->json(['message' => 'Antrean ini tidak termasuk layanan di loket terpilih.'], 422);
        }

        // Jika sudah dipanggil/dilayani, langsung return sukses
        if (in_array($queue->status, ['called', 'serving'])) {
            return response()->json($queue->load('service'));
        }

        if (!in_array($queue->status, ['waiting', 'skipped'])) {
            return response()->json(['message' => 'Queue cannot be called. Current status: ' . $queue->status], 422);
        }

        // Check if there's already a queue being called or served
        $currentQueue = Queue::query()
            ->whereIn('status', ['called', 'serving'])
            ->whereIn('service_id', $assigned)
            ->where('queue_date', now()->toDateString())
            ->where('id', '!=', $queue->id)
            ->first();

        if ($currentQueue) {
            return response()->json([
                'message' => 'Selesaikan atau lewati antrean saat ini terlebih dahulu.',
                'current_queue' => $currentQueue->ticket_code,
            ], 422);
        }

        // Reset semua field ketika dipanggil ulang dari skipped/waiting
        $queue->update([
            'status' => 'called',
            'called_at' => now(),
            'recall_count' => 0, // Reset recall count
            'started_at' => null, // Reset started
            'completed_at' => null, // Reset completed
            'skipped_at' => null, // Reset skipped
        ]);

        return response()->json($queue->load('service'));
    }

    public function start(Queue $queue)
    {
        if ($queue->status !== 'called') {
            return response()->json(['message' => 'Queue is not ready to serve.'], 422);
        }

        $queue->update([
            'status' => 'serving',
            'started_at' => now(),
        ]);

        return response()->json($queue->load('service'));
    }

    public function recall(Queue $queue)
    {
        // Hanya bisa recall kalau sedang dipanggil (belum dilayani/selesai/skip)
        if (!in_array($queue->status, ['called', 'serving'])) {
            return response()->json(['message' => 'Queue cannot be recalled. Current status: ' . $queue->status], 422);
        }

        if ($queue->recall_count >= 3) {
            return response()->json(['message' => 'Recall limit reached (max 3 times).'], 422);
        }

        // Reset ke status called dengan recall count naik
        $queue->update([
            'status' => 'called',
            'recall_count' => $queue->recall_count + 1,
            'called_at' => now(),
        ]);

        return response()->json($queue->load('service'));
    }

    public function skip(Queue $queue)
    {
        if (! in_array($queue->status, ['called', 'serving'], true)) {
            return response()->json(['message' => 'Queue cannot be skipped now.'], 422);
        }

        $queue->update([
            'status' => 'skipped',
            'skipped_at' => now(),
        ]);

        return response()->json($queue->load('service'));
    }

    public function complete(Queue $queue)
    {
        if ($queue->status !== 'serving') {
            return response()->json(['message' => 'Queue is not in serving status.'], 422);
        }

        $queue->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return response()->json($queue->load('service'));
    }

    public function dashboard(Request $request)
    {
        $validated = $request->validate([
            'counter_id' => ['required', 'integer', 'exists:counters,id'],
        ]);

        $counter = Counter::findOrFail($validated['counter_id']);
        $assigned = $counter->assigned_services ?? [];

        if (count($assigned) === 0) {
            return response()->json([
                'current' => null,
                'waiting_count' => 0,
                'recent_completed' => [],
            ]);
        }

        $current = Queue::query()
            ->whereIn('service_id', $assigned)
            ->whereIn('status', ['called', 'serving'])
            ->where('queue_date', now()->toDateString())
            ->orderByDesc('updated_at')
            ->first();

        if ($current && $current->face_capture_path) {
            $current->setAttribute('face_capture_url', asset('storage/'.$current->face_capture_path));
        }

        $waitingCount = Queue::query()
            ->whereIn('service_id', $assigned)
            ->where('status', 'waiting')
            ->where('queue_date', now()->toDateString())
            ->count();

        $waitingQueues = Queue::query()
            ->whereIn('service_id', $assigned)
            ->where('status', 'waiting')
            ->where('queue_date', now()->toDateString())
            ->orderBy('ticket_number')
            ->limit(10)
            ->get()
            ->load('service');

        $skippedQueues = Queue::query()
            ->whereIn('service_id', $assigned)
            ->where('status', 'skipped')
            ->where('queue_date', now()->toDateString())
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get()
            ->load('service');

        $recentCompleted = Queue::query()
            ->whereIn('service_id', $assigned)
            ->where('status', 'completed')
            ->where('queue_date', now()->toDateString())
            ->orderByDesc('completed_at')
            ->get();

        return response()->json([
            'current' => $current?->load(['service', 'visitor']),
            'waiting_count' => $waitingCount,
            'waiting_queues' => $waitingQueues,
            'skipped_queues' => $skippedQueues,
            'recent_completed' => $recentCompleted->load('service'),
        ]);
    }

    public function resetToday(Request $request)
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Forbidden');

        $deleted = Queue::query()
            ->where('queue_date', now()->toDateString())
            ->delete();

        return response()->json([
            'deleted' => $deleted,
        ]);
    }

    private function storeFaceCapture(Queue $queue, string $base64Data): ?string
    {
        if (! preg_match('/^data:image\/(jpeg|jpg);base64,/', $base64Data)) {
            return null;
        }

        $binaryData = base64_decode(substr($base64Data, strpos($base64Data, ',') + 1), true);
        if ($binaryData === false) {
            return null;
        }

        $safeTicket = preg_replace('/[^A-Za-z0-9\-_]/', '_', $queue->ticket_code);
        $filename = now()->format('Ymd').'_'.$safeTicket.'.jpg';
        $path = 'queue-faces/'.$filename;

        Storage::disk('public')->put($path, $binaryData);
        $this->cleanupOldFaceCaptures();

        return $path;
    }

    private function cleanupOldFaceCaptures(): void
    {
        $retentionDays = (int) env('FACE_CAPTURE_RETENTION_DAYS', 30);
        if ($retentionDays <= 0) {
            return;
        }

        $threshold = Carbon::now()->subDays($retentionDays);

        $expiredQueues = Queue::query()
            ->whereNotNull('face_capture_path')
            ->where('created_at', '<', $threshold)
            ->get(['id', 'face_capture_path']);

        if ($expiredQueues->isEmpty()) {
            return;
        }

        foreach ($expiredQueues as $expiredQueue) {
            if ($expiredQueue->face_capture_path) {
                Storage::disk('public')->delete($expiredQueue->face_capture_path);
            }
        }

        Queue::query()
            ->whereIn('id', $expiredQueues->pluck('id')->all())
            ->update(['face_capture_path' => null]);
    }
}
