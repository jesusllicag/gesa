<?php

use App\Models\Client;
use App\Models\Image;
use App\Models\InstanceType;
use App\Models\OperatingSystem;
use App\Models\Region;

beforeEach(function () {
    $this->client = Client::factory()->create(['must_change_password' => false]);
    $this->region = Region::factory()->create();
    $this->os = OperatingSystem::factory()->create();
    $this->image = Image::factory()->create(['operating_system_id' => $this->os->id]);
    $this->instanceType = InstanceType::factory()->create(['precio_hora' => 0.10, 'memoria_gb' => 4]);
});

describe('store', function () {
    it('requires client authentication', function () {
        $this->post('/client/solicitudes')
            ->assertRedirect('/client/login');
    });

    it('can submit a solicitud correctly', function () {
        $data = [
            'nombre' => 'mi-servidor-web',
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
            'ram_gb' => 4,
            'disco_gb' => 50,
            'disco_tipo' => 'SSD',
            'conexion' => 'publica',
            'medio_pago' => 'transferencia_bancaria',
        ];

        $this->actingAs($this->client, 'client')
            ->post('/client/solicitudes', $data)
            ->assertRedirect();

        $this->assertDatabaseHas('solicitud_servidores', [
            'client_id' => $this->client->id,
            'nombre' => 'mi-servidor-web',
            'estado' => 'pendiente',
            'medio_pago' => 'transferencia_bancaria',
        ]);
    });

    it('validates required fields', function () {
        $this->actingAs($this->client, 'client')
            ->post('/client/solicitudes', [])
            ->assertSessionHasErrors([
                'nombre',
                'region_id',
                'operating_system_id',
                'image_id',
                'instance_type_id',
                'ram_gb',
                'disco_gb',
                'disco_tipo',
                'conexion',
                'medio_pago',
            ]);
    });

    it('validates medio_pago values', function () {
        $data = [
            'nombre' => 'mi-servidor',
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
            'ram_gb' => 4,
            'disco_gb' => 50,
            'disco_tipo' => 'SSD',
            'conexion' => 'publica',
            'medio_pago' => 'bitcoin',
        ];

        $this->actingAs($this->client, 'client')
            ->post('/client/solicitudes', $data)
            ->assertSessionHasErrors(['medio_pago']);
    });

    it('calculates estimated daily cost', function () {
        $data = [
            'nombre' => 'servidor-costo',
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
            'ram_gb' => 4,
            'disco_gb' => 50,
            'disco_tipo' => 'SSD',
            'conexion' => 'publica',
            'medio_pago' => 'paypal',
        ];

        $this->actingAs($this->client, 'client')
            ->post('/client/solicitudes', $data)
            ->assertRedirect();

        $solicitud = $this->client->solicitudes()->first();
        expect((float) $solicitud->costo_diario_estimado)->toBeGreaterThan(0);
    });

    it('sets initial estado as pendiente', function () {
        $data = [
            'nombre' => 'servidor-pendiente',
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
            'ram_gb' => 8,
            'disco_gb' => 100,
            'disco_tipo' => 'HDD',
            'conexion' => 'privada',
            'medio_pago' => 'tarjeta_credito',
        ];

        $this->actingAs($this->client, 'client')
            ->post('/client/solicitudes', $data)
            ->assertRedirect();

        $solicitud = $this->client->solicitudes()->first();
        expect($solicitud->estado)->toBe('pendiente');
        expect($solicitud->reviewed_by)->toBeNull();
        expect($solicitud->reviewed_at)->toBeNull();
    });
});
