<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Counter;
use App\Models\Queue;
use App\Models\Survey;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ReportController extends Controller
{
    protected function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Forbidden');
    }

    public function queueStats(Request $request)
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'period' => ['required', 'in:daily,monthly'],
            'date' => ['nullable', 'date'],
        ]);

        $date = $validated['date'] ? Carbon::parse($validated['date']) : now();

        $query = Queue::query();
        if ($validated['period'] === 'daily') {
            $query->where('queue_date', $date->toDateString());
        } else {
            $query->whereBetween('queue_date', [
                $date->copy()->startOfMonth()->toDateString(),
                $date->copy()->endOfMonth()->toDateString(),
            ]);
        }

        $total = (clone $query)->count();
        $skipped = (clone $query)->where('status', 'skipped')->count();

        $avgWaitMinutes = (clone $query)
            ->whereNotNull('called_at')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(MINUTE, created_at, called_at)) as avg_wait'))
            ->value('avg_wait');

        return response()->json([
            'period' => $validated['period'],
            'date' => $date->toDateString(),
            'total_visitors' => $total,
            'skipped' => $skipped,
            'avg_wait_minutes' => $avgWaitMinutes ? (float) $avgWaitMinutes : null,
        ]);
    }

    public function surveyStats(Request $request)
    {
        $this->ensureAdmin($request);

        $data = Survey::query()
            ->select('rating', DB::raw('COUNT(*) as total'))
            ->groupBy('rating')
            ->orderBy('rating')
            ->get();

        return response()->json($data);
    }

    public function exportExcel(Request $request)
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'period' => ['required', 'in:daily,monthly'],
            'date' => ['nullable', 'date'],
        ]);

        $date = $validated['date'] ? Carbon::parse($validated['date']) : now();

        $query = Queue::query();
        if ($validated['period'] === 'daily') {
            $query->where('queue_date', $date->toDateString());
        } else {
            $query->whereBetween('queue_date', [
                $date->copy()->startOfMonth()->toDateString(),
                $date->copy()->endOfMonth()->toDateString(),
            ]);
        }

        $total = (clone $query)->count();
        $completed = (clone $query)->where('status', 'completed')->count();
        $skipped = (clone $query)->where('status', 'skipped')->count();
        $called = (clone $query)->where('status', 'called')->count();
        $serving = (clone $query)->where('status', 'serving')->count();
        $waiting = (clone $query)->where('status', 'waiting')->count();

        $avgWaitMinutes = (clone $query)
            ->whereNotNull('called_at')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(MINUTE, created_at, called_at)) as avg_wait'))
            ->value('avg_wait');

        $surveyData = Survey::query()
            ->select('rating', DB::raw('COUNT(*) as total'))
            ->groupBy('rating')
            ->orderByDesc('rating')
            ->get();

        $serviceStats = (clone $query)
            ->join('services', 'queues.service_id', '=', 'services.id')
            ->selectRaw("services.id, services.code, services.name, COUNT(*) as total")
            ->selectRaw("SUM(CASE WHEN queues.status = 'waiting' THEN 1 ELSE 0 END) as waiting")
            ->selectRaw("SUM(CASE WHEN queues.status = 'called' THEN 1 ELSE 0 END) as called")
            ->selectRaw("SUM(CASE WHEN queues.status = 'serving' THEN 1 ELSE 0 END) as serving")
            ->selectRaw("SUM(CASE WHEN queues.status = 'completed' THEN 1 ELSE 0 END) as completed")
            ->selectRaw("SUM(CASE WHEN queues.status = 'skipped' THEN 1 ELSE 0 END) as skipped")
            ->selectRaw("AVG(CASE WHEN queues.called_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, queues.created_at, queues.called_at) END) as avg_wait")
            ->groupBy('services.id', 'services.code', 'services.name')
            ->orderBy('services.code')
            ->get();

        $counterMap = Counter::query()
            ->get(['name', 'assigned_services'])
            ->map(function (Counter $counter) {
                return [
                    'name' => $counter->name,
                    'assigned_services' => $counter->assigned_services ?? [],
                ];
            });

        $spreadsheet = new Spreadsheet();

        $statsSheet = $spreadsheet->getActiveSheet();
        $statsSheet->setTitle('Laporan Antrean');
        $statsSheet->mergeCells('A1:B1');
        $statsSheet->setCellValue('A1', 'LAPORAN STATISTIK ANTREAN');
        $statsSheet->fromArray([
            ['Periode', $validated['period'] === 'daily' ? 'Harian' : 'Bulanan'],
            ['Tanggal Acuan', $date->toDateString()],
            ['Dicetak Pada', now()->format('Y-m-d H:i:s')],
            [],
            ['Metrik', 'Nilai'],
            ['Total Pengunjung', $total],
            ['Menunggu', $waiting],
            ['Dipanggil', $called],
            ['Sedang Dilayani', $serving],
            ['Selesai', $completed],
            ['Total Skipped', $skipped],
            ['Rata-rata Tunggu (menit)', $avgWaitMinutes ? round((float) $avgWaitMinutes, 2) : '-'],
        ], null, 'A2');

        $statsSheet->getStyle('A1:B1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1E6B3D']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $statsSheet->getStyle('A6:B6')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '0E7490']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $statsSheet->getStyle('A2:B13')->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'D1D5DB'],
                ],
            ],
        ]);

        $statsSheet->freezePane('A7');

        foreach (['A', 'B'] as $column) {
            $statsSheet->getColumnDimension($column)->setAutoSize(true);
        }

        $serviceSheet = $spreadsheet->createSheet();
        $serviceSheet->setTitle('Per Layanan');
        $serviceSheet->fromArray([
            ['Kode', 'Layanan', 'Total', 'Menunggu', 'Dipanggil', 'Dilayani', 'Selesai', 'Skipped', 'Avg Tunggu (menit)', 'Loket Potensial'],
        ], null, 'A1');
        $serviceSheet->getStyle('A1:J1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '334155']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $serviceRow = 2;
        foreach ($serviceStats as $item) {
            $possibleCounters = $counterMap
                ->filter(fn ($counter) => in_array((int) $item->id, $counter['assigned_services'], true))
                ->pluck('name')
                ->implode(', ');

            $serviceSheet->fromArray([[
                $item->code,
                $item->name,
                (int) $item->total,
                (int) $item->waiting,
                (int) $item->called,
                (int) $item->serving,
                (int) $item->completed,
                (int) $item->skipped,
                $item->avg_wait !== null ? round((float) $item->avg_wait, 2) : '-',
                $possibleCounters !== '' ? $possibleCounters : '-',
            ]], null, "A{$serviceRow}");
            $serviceRow++;
        }

        if ($serviceRow === 2) {
            $serviceSheet->setCellValue('A2', 'Tidak ada data pada periode ini');
            $serviceSheet->mergeCells('A2:J2');
        }

        $serviceSheet->getStyle('A1:J'.max(2, $serviceRow - 1))->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'E5E7EB'],
                ],
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
        $serviceSheet->freezePane('A2');
        foreach (range('A', 'J') as $column) {
            $serviceSheet->getColumnDimension($column)->setAutoSize(true);
        }

        $surveySheet = $spreadsheet->createSheet();
        $surveySheet->setTitle('Kepuasan');
        $surveySheet->fromArray([
            ['Rating', 'Label', 'Total', 'Persentase'],
        ], null, 'A1');
        $surveySheet->getStyle('A1:D1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '7C3AED']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $labels = [
            4 => 'Sangat Puas',
            3 => 'Puas',
            2 => 'Cukup',
            1 => 'Kurang',
        ];

        $totalSurvey = (int) $surveyData->sum('total');

        $row = 2;
        foreach ($labels as $rating => $label) {
            $totalByRating = (int) ($surveyData->firstWhere('rating', $rating)->total ?? 0);
            $percentage = $totalSurvey > 0 ? round(($totalByRating / $totalSurvey) * 100, 2).'%' : '0%';
            $surveySheet->setCellValue("A{$row}", $rating);
            $surveySheet->setCellValue("B{$row}", $label);
            $surveySheet->setCellValue("C{$row}", $totalByRating);
            $surveySheet->setCellValue("D{$row}", $percentage);
            $row++;
        }

        $surveySheet->setCellValue("B{$row}", 'Total Responden');
        $surveySheet->setCellValue("C{$row}", $totalSurvey);
        $surveySheet->getStyle("B{$row}:C{$row}")->getFont()->setBold(true);

        $surveySheet->getStyle('A1:D'.$row)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'E5E7EB'],
                ],
            ],
        ]);

        foreach (['A', 'B', 'C', 'D'] as $column) {
            $surveySheet->getColumnDimension($column)->setAutoSize(true);
        }

        $spreadsheet->setActiveSheetIndex(0);

        $fileName = 'laporan-antrian-'.($validated['period'] === 'daily' ? 'harian' : 'bulanan').'-'.$date->format('Y-m-d').'.xlsx';

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
