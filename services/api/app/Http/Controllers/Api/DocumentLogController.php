<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentLog;
use App\Models\Visitor;
use Illuminate\Http\Request;

class DocumentLogController extends Controller
{
    public function index(Request $request)
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'staff'], true), 403, 'Forbidden');

        $search = trim((string) $request->query('search', ''));

        $logs = DocumentLog::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('nik', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('document_type', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('updated_at')
            ->limit(100)
            ->get();

        return response()->json($logs);
    }

    public function store(Request $request)
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'staff'], true), 403, 'Forbidden');

        $validated = $request->validate([
            'nik' => ['required', 'string', 'max:32'],
            'name' => ['required', 'string', 'max:255'],
            'document_type' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:diproses,siap_diambil,diambil'],
            'pickup_counter' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $visitor = Visitor::query()->where('nik', trim($validated['nik']))->first();

        $log = DocumentLog::create([
            'visitor_id' => $visitor?->id,
            'nik' => trim($validated['nik']),
            'name' => trim($validated['name']),
            'document_type' => trim($validated['document_type']),
            'status' => $validated['status'],
            'pickup_counter' => isset($validated['pickup_counter']) ? trim($validated['pickup_counter']) : null,
            'notes' => $validated['notes'] ?? null,
            'updated_by' => $request->user()?->id,
        ]);

        return response()->json($log, 201);
    }

    public function update(Request $request, DocumentLog $documentLog)
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'staff'], true), 403, 'Forbidden');

        if ($documentLog->status === 'diambil') {
            return response()->json([
                'message' => 'Status dokumen yang sudah diambil tidak dapat diubah lagi.',
            ], 422);
        }

        $validated = $request->validate([
            'status' => ['nullable', 'in:diproses,siap_diambil,diambil'],
            'pickup_counter' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $documentLog->update([
            'status' => $validated['status'] ?? $documentLog->status,
            'pickup_counter' => array_key_exists('pickup_counter', $validated)
                ? trim((string) $validated['pickup_counter'])
                : $documentLog->pickup_counter,
            'notes' => array_key_exists('notes', $validated)
                ? $validated['notes']
                : $documentLog->notes,
            'updated_by' => $request->user()?->id,
        ]);

        return response()->json($documentLog->fresh());
    }

    public function check(Request $request)
    {
        $validated = $request->validate([
            'token' => ['nullable', 'string', 'max:255'],
            'nik' => ['nullable', 'string', 'max:32'],
        ]);

        $token = isset($validated['token']) ? trim($validated['token']) : null;
        $nik = isset($validated['nik']) ? trim($validated['nik']) : null;

        if (! $token && ! $nik) {
            return response()->json([
                'message' => 'Token atau NIK wajib diisi.',
            ], 422);
        }

        if ($token) {
            $visitor = Visitor::query()->where('qr_code_string', $token)->first();
            if (! $visitor) {
                return response()->json([
                    'message' => 'Token warga tidak ditemukan.',
                ], 404);
            }
            $nik = $visitor->nik;
        }

        $log = DocumentLog::query()
            ->where('nik', $nik)
            ->orderByDesc('updated_at')
            ->first();

        if (! $log) {
            return response()->json([
                'found' => false,
                'message' => 'Belum ada status dokumen untuk NIK ini.',
            ], 404);
        }

        return response()->json([
            'found' => true,
            'status' => $log,
            'message' => 'Status dokumen ditemukan.',
        ]);
    }
}
