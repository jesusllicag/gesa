<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Region>
 */
class RegionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $regions = [
            ['codigo' => 'us-east-1', 'nombre' => 'US East (N. Virginia)'],
            ['codigo' => 'us-west-2', 'nombre' => 'US West (Oregon)'],
            ['codigo' => 'eu-west-1', 'nombre' => 'Europe (Ireland)'],
            ['codigo' => 'sa-east-1', 'nombre' => 'South America (Sao Paulo)'],
            ['codigo' => 'ap-northeast-1', 'nombre' => 'Asia Pacific (Tokyo)'],
        ];

        $region = fake()->randomElement($regions);

        return [
            'codigo' => $region['codigo'],
            'nombre' => $region['nombre'],
        ];
    }
}
