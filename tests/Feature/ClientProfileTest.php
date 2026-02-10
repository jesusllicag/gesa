<?php

use App\Models\Client;

beforeEach(function () {
    $this->client = Client::factory()->create(['must_change_password' => false]);
});

describe('edit', function () {
    it('requires client authentication', function () {
        $this->get('/client/profile')
            ->assertRedirect('/client/login');
    });

    it('shows the profile page with client data', function () {
        $this->actingAs($this->client, 'client')
            ->get('/client/profile')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('client/profile')
                ->where('client.nombre', $this->client->nombre)
                ->where('client.email', $this->client->email)
                ->where('client.tipo_documento', $this->client->tipo_documento)
                ->where('client.numero_documento', $this->client->numero_documento)
            );
    });
});

describe('update', function () {
    it('requires client authentication', function () {
        $this->put('/client/profile')
            ->assertRedirect('/client/login');
    });

    it('updates client data', function () {
        $this->actingAs($this->client, 'client')
            ->put('/client/profile', [
                'nombre' => 'Nombre Actualizado',
                'email' => 'nuevo@email.com',
                'tipo_documento' => 'RUC',
                'numero_documento' => '12345678901',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('clients', [
            'id' => $this->client->id,
            'nombre' => 'Nombre Actualizado',
            'email' => 'nuevo@email.com',
            'tipo_documento' => 'RUC',
            'numero_documento' => '12345678901',
        ]);
    });

    it('validates required fields', function () {
        $this->actingAs($this->client, 'client')
            ->put('/client/profile', [])
            ->assertSessionHasErrors(['nombre', 'email', 'tipo_documento', 'numero_documento']);
    });

    it('validates unique email', function () {
        Client::factory()->create(['email' => 'taken@email.com']);

        $this->actingAs($this->client, 'client')
            ->put('/client/profile', [
                'nombre' => 'Test',
                'email' => 'taken@email.com',
                'tipo_documento' => 'DNI',
                'numero_documento' => '99999999',
            ])
            ->assertSessionHasErrors(['email']);
    });

    it('validates unique numero_documento', function () {
        Client::factory()->create(['numero_documento' => '11111111']);

        $this->actingAs($this->client, 'client')
            ->put('/client/profile', [
                'nombre' => 'Test',
                'email' => 'unique@email.com',
                'tipo_documento' => 'DNI',
                'numero_documento' => '11111111',
            ])
            ->assertSessionHasErrors(['numero_documento']);
    });

    it('validates tipo_documento values', function () {
        $this->actingAs($this->client, 'client')
            ->put('/client/profile', [
                'nombre' => 'Test',
                'email' => 'test@email.com',
                'tipo_documento' => 'PASSPORT',
                'numero_documento' => '12345678',
            ])
            ->assertSessionHasErrors(['tipo_documento']);
    });

    it('allows keeping own email without unique error', function () {
        $this->actingAs($this->client, 'client')
            ->put('/client/profile', [
                'nombre' => 'Nombre Actualizado',
                'email' => $this->client->email,
                'tipo_documento' => $this->client->tipo_documento,
                'numero_documento' => $this->client->numero_documento,
            ])
            ->assertSessionHasNoErrors();
    });

    it('allows keeping own numero_documento without unique error', function () {
        $this->actingAs($this->client, 'client')
            ->put('/client/profile', [
                'nombre' => 'Nombre Actualizado',
                'email' => 'new@email.com',
                'tipo_documento' => $this->client->tipo_documento,
                'numero_documento' => $this->client->numero_documento,
            ])
            ->assertSessionHasNoErrors();
    });
});
