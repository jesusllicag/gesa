<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Client>
 */
class ClientFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tipoDocumento = fake()->randomElement(['DNI', 'RUC']);

        return [
            'nombre' => fake()->company(),
            'email' => fake()->unique()->companyEmail(),
            'tipo_documento' => $tipoDocumento,
            'numero_documento' => $tipoDocumento === 'DNI'
                ? fake()->unique()->numerify('########')
                : fake()->unique()->numerify('###########'),
            'created_by' => User::factory(),
        ];
    }

    /**
     * Indicate that the client has DNI document type.
     */
    public function withDni(): static
    {
        return $this->state(fn (array $attributes) => [
            'tipo_documento' => 'DNI',
            'numero_documento' => fake()->unique()->numerify('########'),
        ]);
    }

    /**
     * Indicate that the client has RUC document type.
     */
    public function withRuc(): static
    {
        return $this->state(fn (array $attributes) => [
            'tipo_documento' => 'RUC',
            'numero_documento' => fake()->unique()->numerify('###########'),
        ]);
    }
}
