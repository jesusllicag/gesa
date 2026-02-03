<?php

namespace Database\Factories;

use App\Models\OperatingSystem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Image>
 */
class ImageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'operating_system_id' => OperatingSystem::factory(),
            'nombre' => fake()->words(3, true),
            'version' => fake()->semver(),
            'arquitectura' => fake()->randomElement(['32-bit', '64-bit']),
            'ami_id' => 'ami-'.fake()->unique()->regexify('[a-z0-9]{17}'),
            'descripcion' => fake()->sentence(),
        ];
    }
}
