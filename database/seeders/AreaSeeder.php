<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AreaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('areas')->insert([
            ['name' => 'Administración', 'location' => 'Piso 1', 'description' => 'Departamento de administración', 'manager_id' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Tecnología', 'location' => 'Piso 2', 'description' => 'Departamento de TI', 'manager_id' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Recursos Humanos', 'location' => 'Piso 1', 'description' => 'Departamento de RRHH', 'manager_id' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Operaciones', 'location' => 'Piso 3', 'description' => 'Departamento de operaciones', 'manager_id' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Almacén', 'location' => 'Sótano', 'description' => 'Almacén central', 'manager_id' => null, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
