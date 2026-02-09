<?php

use App\Models\Image;
use App\Models\InstanceType;
use App\Models\OperatingSystem;
use App\Models\Region;
use App\Models\SolicitudServidor;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->region = Region::factory()->create();
    $this->os = OperatingSystem::factory()->create();
    $this->image = Image::factory()->create(['operating_system_id' => $this->os->id]);
    $this->instanceType = InstanceType::factory()->create();
});

describe('index', function () {
    it('requires authentication', function () {
        $this->get('/admin/solicitudes')
            ->assertRedirect('/admin/login');
    });

    it('displays solicitudes list', function () {
        SolicitudServidor::factory()->count(3)->create([
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
        ]);

        $this->actingAs($this->user)
            ->get('/admin/solicitudes')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('solicitudes/index')
                ->has('solicitudes.data', 3)
            );
    });

    it('filters by estado', function () {
        SolicitudServidor::factory()->pendiente()->count(2)->create([
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
        ]);
        SolicitudServidor::factory()->aprobada()->create([
            'reviewed_by' => $this->user->id,
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
        ]);

        $this->actingAs($this->user)
            ->get('/admin/solicitudes?estado=pendiente')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('solicitudes.data', 2)
            );
    });
});

describe('approve', function () {
    it('can approve a pending solicitud', function () {
        $solicitud = SolicitudServidor::factory()->pendiente()->create([
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
        ]);

        $this->actingAs($this->user)
            ->post("/admin/solicitudes/{$solicitud->id}/approve")
            ->assertRedirect();

        $solicitud->refresh();
        expect($solicitud->estado)->toBe('aprobada');
        expect($solicitud->reviewed_by)->toBe($this->user->id);
        expect($solicitud->reviewed_at)->not->toBeNull();

        $this->assertDatabaseHas('servers', [
            'nombre' => $solicitud->nombre,
            'client_id' => $solicitud->client_id,
            'estado' => 'pending',
        ]);
    });

    it('cannot approve an already approved solicitud', function () {
        $solicitud = SolicitudServidor::factory()->aprobada()->create([
            'reviewed_by' => $this->user->id,
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
        ]);

        $this->actingAs($this->user)
            ->post("/admin/solicitudes/{$solicitud->id}/approve")
            ->assertRedirect()
            ->assertSessionHas('error');
    });

    it('cannot approve a rejected solicitud', function () {
        $solicitud = SolicitudServidor::factory()->rechazada()->create([
            'reviewed_by' => $this->user->id,
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
        ]);

        $this->actingAs($this->user)
            ->post("/admin/solicitudes/{$solicitud->id}/approve")
            ->assertRedirect()
            ->assertSessionHas('error');
    });
});

describe('reject', function () {
    it('can reject a pending solicitud with motivo', function () {
        $solicitud = SolicitudServidor::factory()->pendiente()->create([
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
        ]);

        $this->actingAs($this->user)
            ->post("/admin/solicitudes/{$solicitud->id}/reject", [
                'motivo_rechazo' => 'No cumple con los requisitos minimos.',
            ])
            ->assertRedirect();

        $solicitud->refresh();
        expect($solicitud->estado)->toBe('rechazada');
        expect($solicitud->motivo_rechazo)->toBe('No cumple con los requisitos minimos.');
        expect($solicitud->reviewed_by)->toBe($this->user->id);
        expect($solicitud->reviewed_at)->not->toBeNull();
    });

    it('requires motivo_rechazo', function () {
        $solicitud = SolicitudServidor::factory()->pendiente()->create([
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
        ]);

        $this->actingAs($this->user)
            ->post("/admin/solicitudes/{$solicitud->id}/reject", [])
            ->assertSessionHasErrors(['motivo_rechazo']);
    });

    it('cannot reject an already approved solicitud', function () {
        $solicitud = SolicitudServidor::factory()->aprobada()->create([
            'reviewed_by' => $this->user->id,
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
        ]);

        $this->actingAs($this->user)
            ->post("/admin/solicitudes/{$solicitud->id}/reject", [
                'motivo_rechazo' => 'Motivo de prueba.',
            ])
            ->assertRedirect()
            ->assertSessionHas('error');
    });
});
