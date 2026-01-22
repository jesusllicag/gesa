<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AssetStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('asset_statuses')->insert([
            ['name' => 'Activo', 'description' => 'Activo en uso', 'color' => '#10B981', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Inactivo', 'description' => 'Activo inactivo o fuera de servicio', 'color' => '#6B7280', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'En Mantenimiento', 'description' => 'Activo en proceso de mantenimiento', 'color' => '#F59E0B', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'En Reparación', 'description' => 'Activo dañado en reparación', 'color' => '#EF4444', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Desechado', 'description' => 'Activo dado de baja o desechado', 'color' => '#8B5CF6', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
