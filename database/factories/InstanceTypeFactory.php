<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InstanceType>
 */
class InstanceTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $familia = fake()->randomElement(['t2', 't3', 'm5', 'c5', 'r5']);
        $size = fake()->randomElement(['micro', 'small', 'medium', 'large', 'xlarge']);

        return [
            'nombre' => $familia.'.'.$size,
            'familia' => $familia,
            'vcpus' => fake()->randomElement([1, 2, 4, 8, 16]),
            'procesador' => 'Intel Xeon',
            'memoria_gb' => fake()->randomElement([0.5, 1, 2, 4, 8, 16, 32]),
            'almacenamiento_incluido' => 'Solo EBS',
            'rendimiento_red' => fake()->randomElement(['Bajo', 'Moderado', 'Alto', 'Hasta 10 Gbps']),
        ];
    }
}
