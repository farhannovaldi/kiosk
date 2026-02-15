<?php

namespace Database\Seeders;

use App\Models\Requirement;
use Illuminate\Database\Seeder;

class RequirementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $requirements = [
            [
                'title' => 'KTP Baru',
                'content' => "1. Surat pengantar RT/RW\n2. KK asli\n3. Fotokopi akta lahir",
            ],
            [
                'title' => 'Akte Kelahiran',
                'content' => "1. Surat keterangan lahir\n2. KK asli\n3. KTP orang tua",
            ],
            [
                'title' => 'Surat Pindah',
                'content' => "1. KTP asli\n2. KK asli\n3. Surat pengantar RT/RW",
            ],
        ];

        foreach ($requirements as $requirement) {
            Requirement::updateOrCreate(
                ['title' => $requirement['title']],
                array_merge($requirement, ['is_active' => true])
            );
        }
    }
}
