<?php

use App\Models\Client;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
});

describe('index', function () {
    it('requires authentication', function () {
        $this->get('/admin/clients')
            ->assertRedirect('/admin/login');
    });

    it('displays paginated clients', function () {
        Client::factory()->count(3)->create(['created_by' => $this->user->id]);

        $this->actingAs($this->user)
            ->get('/admin/clients')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('clients/index')
                ->has('clients.data', 3)
            );
    });

    it('can search clients by name', function () {
        Client::factory()->create(['nombre' => 'Empresa ABC', 'created_by' => $this->user->id]);
        Client::factory()->create(['nombre' => 'Empresa XYZ', 'created_by' => $this->user->id]);

        $this->actingAs($this->user)
            ->get('/admin/clients?search=ABC')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('clients.data', 1)
                ->where('clients.data.0.nombre', 'Empresa ABC')
            );
    });
});

describe('store', function () {
    it('creates a new client', function () {
        $clientData = [
            'nombre' => 'Test Company',
            'email' => 'test@company.com',
            'tipo_documento' => 'RUC',
            'numero_documento' => '12345678901',
        ];

        $this->actingAs($this->user)
            ->post('/admin/clients', $clientData)
            ->assertRedirect();

        $this->assertDatabaseHas('clients', [
            'nombre' => 'Test Company',
            'email' => 'test@company.com',
            'tipo_documento' => 'RUC',
            'numero_documento' => '12345678901',
            'created_by' => $this->user->id,
        ]);
    });

    it('validates required fields', function () {
        $this->actingAs($this->user)
            ->post('/admin/clients', [])
            ->assertSessionHasErrors(['nombre', 'email', 'tipo_documento', 'numero_documento']);
    });

    it('validates unique email', function () {
        Client::factory()->create(['email' => 'existing@company.com', 'created_by' => $this->user->id]);

        $this->actingAs($this->user)
            ->post('/admin/clients', [
                'nombre' => 'New Company',
                'email' => 'existing@company.com',
                'tipo_documento' => 'DNI',
                'numero_documento' => '12345678',
            ])
            ->assertSessionHasErrors(['email']);
    });

    it('validates tipo_documento values', function () {
        $this->actingAs($this->user)
            ->post('/admin/clients', [
                'nombre' => 'Test Company',
                'email' => 'test@company.com',
                'tipo_documento' => 'INVALID',
                'numero_documento' => '12345678',
            ])
            ->assertSessionHasErrors(['tipo_documento']);
    });
});

describe('update', function () {
    it('updates an existing client', function () {
        $client = Client::factory()->create(['created_by' => $this->user->id]);

        $this->actingAs($this->user)
            ->put("/admin/clients/{$client->id}", [
                'nombre' => 'Updated Name',
                'email' => 'updated@company.com',
                'tipo_documento' => 'RUC',
                'numero_documento' => '99999999999',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('clients', [
            'id' => $client->id,
            'nombre' => 'Updated Name',
            'email' => 'updated@company.com',
        ]);
    });

    it('allows same email when updating own record', function () {
        $client = Client::factory()->create([
            'email' => 'keep@company.com',
            'created_by' => $this->user->id,
        ]);

        $this->actingAs($this->user)
            ->put("/admin/clients/{$client->id}", [
                'nombre' => 'Updated Name',
                'email' => 'keep@company.com',
                'tipo_documento' => $client->tipo_documento,
                'numero_documento' => $client->numero_documento,
            ])
            ->assertSessionHasNoErrors();
    });
});

describe('destroy', function () {
    it('soft deletes a client', function () {
        $client = Client::factory()->create(['created_by' => $this->user->id]);

        $this->actingAs($this->user)
            ->delete("/admin/clients/{$client->id}")
            ->assertRedirect();

        $this->assertSoftDeleted('clients', ['id' => $client->id]);
    });
});
