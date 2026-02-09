<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Ejecutar seeders de datos de referencia
        $this->call([
            UserSeeder::class,
            RegionSeeder::class,
            OperatingSystemSeeder::class,
            ImageSeeder::class,
            InstanceTypeSeeder::class,
            ClientSeeder::class,
            ServerSeeder::class,
        ]);
    }
}
