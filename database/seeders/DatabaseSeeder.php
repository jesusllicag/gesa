<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Crear usuario de prueba
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Ejecutar seeders de datos de referencia
        $this->call([
            AssetStatusSeeder::class,
            MaintenanceTypeSeeder::class,
            CategorySeeder::class,
            AreaSeeder::class,
        ]);
    }
}
