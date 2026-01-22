<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MaintenanceTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('maintenance_types')->insert([
            ['name' => 'Preventivo', 'description' => 'Mantenimiento preventivo para evitar fallos', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Correctivo', 'description' => 'Mantenimiento para reparar fallas existentes', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Inspección', 'description' => 'Revisión e inspección del activo', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Calibración', 'description' => 'Calibración de equipos', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
