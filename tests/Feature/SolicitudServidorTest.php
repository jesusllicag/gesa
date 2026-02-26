<?php

use App\Models\Image;
use App\Models\InstanceType;
use App\Models\OperatingSystem;
use App\Models\PagoMensual;
use App\Models\Region;
use App\Models\Server;
use App\Models\SolicitudServidor;
use App\Models\User;
use App\Notifications\ServidorPendienteAprobacionNotification;
use Illuminate\Support\Facades\Notification;

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
    it('creates server in pendiente_aprobacion and notifies client when solicitud has no card payment', function () {
        Notification::fake();

        $solicitud = SolicitudServidor::factory()->pendiente()->create([
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
            'mp_payment_id' => null,
        ]);

        $this->actingAs($this->user)
            ->post("/admin/solicitudes/{$solicitud->id}/approve")
            ->assertRedirect();

        $solicitud->refresh();
        expect($solicitud->estado)->toBe('aprobada');
        expect($solicitud->reviewed_by)->toBe($this->user->id);
        expect($solicitud->reviewed_at)->not->toBeNull();

        $server = Server::where('nombre', $solicitud->nombre)->first();
        expect($server)->not->toBeNull();
        expect($server->estado)->toBe('pendiente_aprobacion');
        expect($server->token_aprobacion)->not->toBeNull();
        expect($server->billed_active_ms)->toBe(0);

        Notification::assertSentTo($solicitud->client, ServidorPendienteAprobacionNotification::class);
    });

    it('creates server in pending with 30 days pre-billed when solicitud was paid by card', function () {
        Notification::fake();

        $solicitud = SolicitudServidor::factory()->pendiente()->create([
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
            'costo_diario_estimado' => 2.00,
            'mp_payment_id' => '123456789',
            'mp_payment_status' => 'approved',
        ]);

        $this->actingAs($this->user)
            ->post("/admin/solicitudes/{$solicitud->id}/approve")
            ->assertRedirect();

        $server = Server::where('nombre', $solicitud->nombre)->first();
        expect($server)->not->toBeNull();
        expect($server->estado)->toBe('pending');
        expect($server->token_aprobacion)->toBeNull();
        expect($server->billed_active_ms)->toBe(30 * 24 * 60 * 60 * 1000);

        $pago = PagoMensual::where('server_id', $server->id)->first();
        expect($pago)->not->toBeNull();
        expect($pago->estado)->toBe('pagado');
        expect($pago->fecha_pago)->not->toBeNull();

        Notification::assertNothingSent();
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
