<?php

namespace Database\Seeders;

use App\Models\Counter;
use App\Models\Service;
use Illuminate\Database\Seeder;

class CounterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = Service::query()
            ->whereIn('code', ['A', 'B', 'C'])
            ->get()
            ->keyBy('code');

        if ($services->isEmpty() || ! isset($services['A'], $services['B'], $services['C'])) {
            return;
        }

        $counterData = [
            [
                'name' => 'Loket 1',
                'assigned_services' => [$services['A']->id],
            ],
            [
                'name' => 'Loket 2',
                'assigned_services' => [$services['B']->id, $services['C']->id],
            ],
        ];

        foreach ($counterData as $counter) {
            Counter::updateOrCreate(
                ['name' => $counter['name']],
                array_merge($counter, ['is_active' => true])
            );
        }
    }
}
