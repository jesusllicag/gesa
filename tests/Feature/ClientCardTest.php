<?php

use App\Models\Client;
use App\Models\TarjetaCliente;
use App\Services\MercadoPagoService;

beforeEach(function () {
    $this->client = Client::factory()->create([
        'must_change_password' => false,
        'mp_customer_id' => 'cust_123',
    ]);
});

describe('store', function () {
    it('requires client authentication', function () {
        $this->post('/client/cards')
            ->assertRedirect('/client/login');
    });

    it('adds a card successfully', function () {
        $this->mock(MercadoPagoService::class, function ($mock) {
            $mock->shouldReceive('getOrCreateCustomer')
                ->with(\Mockery::on(fn ($client) => $client->id === $this->client->id))
                ->andReturn('cust_123');

            $mock->shouldReceive('addCard')
                ->with('cust_123', 'test-token-123')
                ->andReturn([
                    'mp_card_id' => 'card_456',
                    'last_four_digits' => '4242',
                    'first_six_digits' => '424242',
                    'brand' => 'visa',
                    'expiration_month' => 12,
                    'expiration_year' => 2028,
                    'cardholder_name' => 'John Doe',
                    'payment_type' => 'credit_card',
                ]);
        });

        $this->actingAs($this->client, 'client')
            ->post('/client/cards', ['token' => 'test-token-123'])
            ->assertRedirect();

        $this->assertDatabaseHas('tarjetas_cliente', [
            'client_id' => $this->client->id,
            'mp_card_id' => 'card_456',
            'last_four_digits' => '4242',
            'brand' => 'visa',
        ]);
    });

    it('validates token is required', function () {
        $this->mock(MercadoPagoService::class);

        $this->actingAs($this->client, 'client')
            ->post('/client/cards', [])
            ->assertSessionHasErrors(['token']);
    });

    it('handles MercadoPago API errors', function () {
        $this->mock(MercadoPagoService::class, function ($mock) {
            $mock->shouldReceive('getOrCreateCustomer')
                ->andReturn('cust_123');

            $mock->shouldReceive('addCard')
                ->andThrow(new \Exception('MercadoPago API error'));
        });

        $this->actingAs($this->client, 'client')
            ->post('/client/cards', ['token' => 'invalid-token'])
            ->assertServerError();
    });
});

describe('destroy', function () {
    it('requires client authentication', function () {
        $tarjeta = TarjetaCliente::factory()->create(['client_id' => $this->client->id]);

        $this->delete("/client/cards/{$tarjeta->id}")
            ->assertRedirect('/client/login');
    });

    it('deletes own card', function () {
        $tarjeta = TarjetaCliente::factory()->create([
            'client_id' => $this->client->id,
            'mp_card_id' => 'card_789',
        ]);

        $this->mock(MercadoPagoService::class, function ($mock) {
            $mock->shouldReceive('deleteCard')
                ->with('cust_123', 'card_789')
                ->once();
        });

        $this->actingAs($this->client, 'client')
            ->delete("/client/cards/{$tarjeta->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('tarjetas_cliente', ['id' => $tarjeta->id]);
    });

    it('forbids deleting another clients card', function () {
        $otherClient = Client::factory()->create(['must_change_password' => false]);
        $tarjeta = TarjetaCliente::factory()->create([
            'client_id' => $otherClient->id,
            'mp_card_id' => 'card_other',
        ]);

        $this->mock(MercadoPagoService::class);

        $this->actingAs($this->client, 'client')
            ->delete("/client/cards/{$tarjeta->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('tarjetas_cliente', ['id' => $tarjeta->id]);
    });
});
