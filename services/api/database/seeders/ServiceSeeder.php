<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            [
                'code' => 'A',
                'name' => 'Pelayanan KTP/KK',
                'description' => 'Urusan administrasi kependudukan KTP dan KK.',
            ],
            [
                'code' => 'B',
                'name' => 'Pelayanan Umum',
                'description' => 'Layanan umum dan konsultasi warga.',
            ],
            [
                'code' => 'C',
                'name' => 'Legalisir',
                'description' => 'Legalisir dokumen resmi.',
            ],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(
                ['code' => $service['code']],
                array_merge($service, ['is_active' => true])
            );
        }
    }
}
