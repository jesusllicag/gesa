<?php

namespace Database\Seeders;

use App\Models\Region;
use Illuminate\Database\Seeder;

class RegionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $regions = [
            [
                'codigo' => 'us-east-1',
                'nombre' => 'US East (N. Virginia)',
            ],
            [
                'codigo' => 'us-west-2',
                'nombre' => 'US West (Oregon)',
            ],
            [
                'codigo' => 'eu-west-1',
                'nombre' => 'Europe (Ireland)',
            ],
            [
                'codigo' => 'sa-east-1',
                'nombre' => 'South America (Sao Paulo)',
            ],
            [
                'codigo' => 'ap-northeast-1',
                'nombre' => 'Asia Pacific (Tokyo)',
            ],
        ];

        foreach ($regions as $region) {
            Region::create($region);
        }
    }
}
