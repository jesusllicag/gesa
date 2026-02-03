<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OperatingSystem>
 */
class OperatingSystemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $os = fake()->randomElement(['Ubuntu', 'Windows', 'macOS', 'Red Hat', 'Debian']);

        return [
            'nombre' => $os,
            'slug' => strtolower(str_replace(' ', '-', $os)),
            'logo' => strtolower(str_replace(' ', '-', $os)).'.svg',
        ];
    }
}
