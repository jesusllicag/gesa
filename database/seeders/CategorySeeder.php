<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('categories')->insert([
            ['name' => 'Equipos de Cómputo', 'code' => 'EQC', 'description' => 'Computadoras, laptops, servidores', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Muebles', 'code' => 'MUE', 'description' => 'Mesas, sillas, armarios, estanterías', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Electrónica', 'code' => 'ELE', 'description' => 'Impresoras, proyectores, monitores', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Maquinaria', 'code' => 'MAQ', 'description' => 'Equipos y maquinaria industrial', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Herramientas', 'code' => 'HER', 'description' => 'Herramientas de mano y equipos de medición', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Vehículos', 'code' => 'VEH', 'description' => 'Vehículos corporativos', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
