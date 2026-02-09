<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Image;
use App\Models\InstanceType;
use App\Models\OperatingSystem;
use App\Models\Region;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SolicitudServidor>
 */
class SolicitudServidorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_id' => Client::factory(),
            'nombre' => fake()->domainWord().'-server',
            'region_id' => Region::factory(),
            'operating_system_id' => OperatingSystem::factory(),
            'image_id' => Image::factory(),
            'instance_type_id' => InstanceType::factory(),
            'ram_gb' => fake()->randomElement([1, 2, 4, 8, 16, 32]),
            'disco_gb' => fake()->randomElement([20, 50, 100, 200, 500]),
            'disco_tipo' => fake()->randomElement(['SSD', 'HDD']),
            'conexion' => fake()->randomElement(['publica', 'privada']),
            'medio_pago' => fake()->randomElement(['transferencia_bancaria', 'tarjeta_credito', 'paypal']),
            'costo_diario_estimado' => fake()->randomFloat(4, 1, 100),
            'estado' => 'pendiente',
        ];
    }

    public function pendiente(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'pendiente',
        ]);
    }

    public function aprobada(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'aprobada',
            'reviewed_at' => now(),
        ]);
    }

    public function rechazada(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'rechazada',
            'motivo_rechazo' => fake()->sentence(),
            'reviewed_at' => now(),
        ]);
    }
}
