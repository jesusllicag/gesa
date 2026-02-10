<?php

namespace Database\Factories;

use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TarjetaCliente>
 */
class TarjetaClienteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $brand = fake()->randomElement(['visa', 'mastercard', 'amex']);

        return [
            'client_id' => Client::factory(),
            'mp_card_id' => (string) fake()->unique()->randomNumber(9),
            'last_four_digits' => fake()->numerify('####'),
            'first_six_digits' => fake()->numerify('######'),
            'brand' => $brand,
            'expiration_month' => fake()->numberBetween(1, 12),
            'expiration_year' => fake()->numberBetween(2026, 2032),
            'cardholder_name' => fake()->name(),
            'payment_type' => fake()->randomElement(['credit_card', 'debit_card']),
        ];
    }
}
