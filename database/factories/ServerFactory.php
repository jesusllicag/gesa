<?php

namespace Database\Factories;

use App\Models\Image;
use App\Models\InstanceType;
use App\Models\OperatingSystem;
use App\Models\Region;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Server>
 */
class ServerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $conexion = fake()->randomElement(['publica', 'privada']);

        return [
            'id' => Str::uuid(),
            'nombre' => fake()->domainWord().'-server',
            'region_id' => Region::factory(),
            'operating_system_id' => OperatingSystem::factory(),
            'image_id' => Image::factory(),
            'instance_type_id' => InstanceType::factory(),
            'ram_gb' => fake()->randomElement([1, 2, 4, 8, 16, 32, 64]),
            'disco_gb' => fake()->randomElement([20, 50, 100, 200, 500, 1000]),
            'disco_tipo' => fake()->randomElement(['SSD', 'HDD']),
            'conexion' => $conexion,
            'clave_privada' => $conexion === 'privada' ? Str::random(32) : null,
            'estado' => fake()->randomElement(['running', 'stopped', 'pending']),
            'created_by' => User::factory(),
        ];
    }

    public function running(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'running',
        ]);
    }

    public function stopped(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'stopped',
        ]);
    }

    public function private(): static
    {
        return $this->state(fn (array $attributes) => [
            'conexion' => 'privada',
            'clave_privada' => Str::random(32),
        ]);
    }

    public function public(): static
    {
        return $this->state(fn (array $attributes) => [
            'conexion' => 'publica',
            'clave_privada' => null,
        ]);
    }
}
