<?php

use App\Models\Client;
use App\Models\Image;
use App\Models\InstanceType;
use App\Models\OperatingSystem;
use App\Models\PagoMensual;
use App\Models\Region;
use App\Models\Server;
use App\Models\User;

beforeEach(function () {
    $this->client = Client::factory()->create(['must_change_password' => false]);
    $this->otherClient = Client::factory()->create(['must_change_password' => false]);
});

function makeClientServer(Client $client, array $attrs = []): Server
{
    $region = Region::factory()->create();
    $os = OperatingSystem::factory()->create();
    $image = Image::factory()->create(['operating_system_id' => $os->id]);
    $instanceType = InstanceType::factory()->create();
    $admin = User::factory()->create();

    return Server::factory()->create(array_merge([
        'client_id' => $client->id,
        'region_id' => $region->id,
        'operating_system_id' => $os->id,
        'image_id' => $image->id,
        'instance_type_id' => $instanceType->id,
        'created_by' => $admin->id,
        'estado' => 'running',
        'costo_diario' => 2.00,
        'billed_active_ms' => 30 * 24 * 60 * 60 * 1000,
        'active_ms' => 0,
        'latest_release' => now(),
        'first_activated_at' => now()->subDays(35),
    ], $attrs));
}

// ──────────────────────────────
// START
// ──────────────────────────────

describe('start', function () {
    it('requires client authentication', function () {
        $server = makeClientServer($this->client, ['estado' => 'stopped', 'latest_release' => null]);

        $this->post("/client/servers/{$server->id}/start")
            ->assertRedirect('/client/login');
    });

    it('starts a stopped server', function () {
        $server = makeClientServer($this->client, ['estado' => 'stopped', 'latest_release' => null]);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->id}/start")
            ->assertRedirect();

        $fresh = $server->fresh();
        expect($fresh->estado)->toBe('running');
        expect($fresh->latest_release)->not->toBeNull();
    });

    it('returns 403 when trying to start a running server', function () {
        $server = makeClientServer($this->client, ['estado' => 'running']);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->id}/start")
            ->assertForbidden();
    });

    it('returns 404 when server belongs to another client', function () {
        $server = makeClientServer($this->otherClient, ['estado' => 'stopped', 'latest_release' => null]);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->id}/start")
            ->assertNotFound();
    });
});

// ──────────────────────────────
// STOP
// ──────────────────────────────

describe('stop', function () {
    it('requires client authentication', function () {
        $server = makeClientServer($this->client);

        $this->post("/client/servers/{$server->id}/stop")
            ->assertRedirect('/client/login');
    });

    it('stops a running server and clears latest_release', function () {
        $server = makeClientServer($this->client, [
            'estado' => 'running',
            'latest_release' => now()->subMinutes(10),
            'active_ms' => 0,
        ]);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->id}/stop")
            ->assertRedirect();

        $fresh = $server->fresh();
        expect($fresh->estado)->toBe('stopped');
        expect($fresh->latest_release)->toBeNull();
    });

    it('returns 403 when trying to stop a stopped server', function () {
        $server = makeClientServer($this->client, ['estado' => 'stopped', 'latest_release' => null]);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->id}/stop")
            ->assertForbidden();
    });

    it('returns 404 when server belongs to another client', function () {
        $server = makeClientServer($this->otherClient);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->id}/stop")
            ->assertNotFound();
    });
});

// ──────────────────────────────
// PAGAR DEUDA
// ──────────────────────────────

describe('pagarDeuda', function () {
    it('requires client authentication', function () {
        $server = makeClientServer($this->client);

        $this->post("/client/servers/{$server->id}/pagar-deuda", [])
            ->assertRedirect('/client/login');
    });

    it('returns 404 when server belongs to another client', function () {
        $server = makeClientServer($this->otherClient, [
            'active_ms' => 40 * 24 * 60 * 60 * 1000,
            'latest_release' => null,
        ]);

        $this->actingAs($this->client, 'client')
            ->postJson("/client/servers/{$server->id}/pagar-deuda", [
                'token' => 'tok_test',
                'installments' => 1,
                'payment_method_id' => 'visa',
            ])
            ->assertNotFound();
    });

    it('returns error session when pending debt is less than 1 day', function () {
        $server = makeClientServer($this->client, [
            'active_ms' => 0,
            'billed_active_ms' => 30 * 24 * 60 * 60 * 1000,
            'latest_release' => null,
            'estado' => 'stopped',
        ]);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->id}/pagar-deuda", [
                'token' => 'tok_test',
                'installments' => 1,
                'payment_method_id' => 'visa',
            ])
            ->assertSessionHasErrors('payment');
    });

    it('validates required payment fields', function () {
        $server = makeClientServer($this->client);

        $this->actingAs($this->client, 'client')
            ->postJson("/client/servers/{$server->id}/pagar-deuda", [])
            ->assertJsonValidationErrors(['token', 'installments', 'payment_method_id']);
    });
});

// ──────────────────────────────
// BILLING: deuda_pendiente in dashboard
// ──────────────────────────────

describe('dashboard deuda_pendiente', function () {
    it('calculates zero debt when active time is within billed window', function () {
        $billedMs = 30 * 24 * 60 * 60 * 1000;

        makeClientServer($this->client, [
            'estado' => 'stopped',
            'active_ms' => $billedMs - 1,
            'billed_active_ms' => $billedMs,
            'latest_release' => null,
        ]);

        $this->actingAs($this->client, 'client')
            ->get('/client/dashboard')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('client/dashboard')
                ->where('servers.0.deuda_pendiente', 0)
            );
    });

    it('calculates positive debt when active time exceeds billed window', function () {
        $billedMs = 30 * 24 * 60 * 60 * 1000;
        $extraMs = 2 * 24 * 60 * 60 * 1000; // 2 extra days active

        makeClientServer($this->client, [
            'estado' => 'stopped',
            'costo_diario' => 2.00,
            'active_ms' => $billedMs + $extraMs,
            'billed_active_ms' => $billedMs,
            'latest_release' => null,
        ]);

        $this->actingAs($this->client, 'client')
            ->get('/client/dashboard')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('client/dashboard')
                ->where('servers.0.deuda_pendiente', 4) // 2 days * $2/day
            );
    });

    it('caps debt at 30 days cost', function () {
        $billedMs = 30 * 24 * 60 * 60 * 1000;
        $extraMs = 45 * 24 * 60 * 60 * 1000; // 45 extra days (over the cap)

        makeClientServer($this->client, [
            'estado' => 'stopped',
            'costo_diario' => 1.00,
            'active_ms' => $billedMs + $extraMs,
            'billed_active_ms' => $billedMs,
            'latest_release' => null,
        ]);

        $this->actingAs($this->client, 'client')
            ->get('/client/dashboard')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('client/dashboard')
                ->where('servers.0.deuda_pendiente', 30) // capped at 30 days * $1/day
            );
    });
});

// ──────────────────────────────
// APPROVAL: billed_active_ms set to 30 days
// ──────────────────────────────

describe('server approval sets billed_active_ms', function () {
    it('sets billed_active_ms to 30 days on transferencia approval', function () {
        $token = \Illuminate\Support\Str::random(64);
        $server = makeClientServer($this->client, [
            'estado' => 'pendiente_aprobacion',
            'token_aprobacion' => $token,
            'costo_diario' => 2.00,
            'billed_active_ms' => 0,
        ]);

        \Illuminate\Support\Facades\Notification::fake();

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$token}/approve", [
                'medio_pago' => 'transferencia_bancaria',
            ])
            ->assertRedirect(route('client.dashboard'));

        $fresh = $server->fresh();
        expect($fresh->billed_active_ms)->toBe(30 * 24 * 60 * 60 * 1000);
        expect($fresh->estado)->toBe('pending');

        $pago = PagoMensual::where('server_id', $server->id)->first();
        expect($pago)->not->toBeNull();
        expect($pago->anio)->toBe(now()->year);
        expect($pago->mes)->toBe(now()->month);
        expect((float) $pago->monto)->toBe(60.0); // 2.00 * 30
        expect($pago->estado)->toBe('pendiente');
        expect($pago->fecha_pago)->toBeNull();
    });
});

// ──────────────────────────────
// PAGAR TRANSFERENCIA
// ──────────────────────────────

describe('pagarTransferencia', function () {
    it('requires client authentication', function () {
        $server = makeClientServer($this->client, [
            'active_ms' => 40 * 24 * 60 * 60 * 1000,
            'billed_active_ms' => 30 * 24 * 60 * 60 * 1000,
            'latest_release' => null,
            'estado' => 'stopped',
        ]);

        $this->post("/client/servers/{$server->id}/pagar-transferencia")
            ->assertRedirect('/client/login');
    });

    it('returns 404 when server belongs to another client', function () {
        $server = makeClientServer($this->otherClient, [
            'active_ms' => 40 * 24 * 60 * 60 * 1000,
            'billed_active_ms' => 30 * 24 * 60 * 60 * 1000,
            'latest_release' => null,
            'estado' => 'stopped',
        ]);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->id}/pagar-transferencia")
            ->assertNotFound();
    });

    it('creates a pending PagoMensual for the debt amount', function () {
        $server = makeClientServer($this->client, [
            'costo_diario' => 1.00,
            'active_ms' => 40 * 24 * 60 * 60 * 1000,
            'billed_active_ms' => 30 * 24 * 60 * 60 * 1000,
            'latest_release' => null,
            'estado' => 'stopped',
        ]);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->id}/pagar-transferencia")
            ->assertRedirect();

        $pago = PagoMensual::where('server_id', $server->id)->where('estado', 'pendiente')->first();
        expect($pago)->not->toBeNull();
        expect((float) $pago->monto)->toBe(10.0); // 10 days * $1/day
        expect($pago->fecha_pago)->toBeNull();
    });

    it('does not update billed_active_ms until admin validates', function () {
        $billedMs = 30 * 24 * 60 * 60 * 1000;
        $server = makeClientServer($this->client, [
            'active_ms' => $billedMs + 5 * 24 * 60 * 60 * 1000,
            'billed_active_ms' => $billedMs,
            'latest_release' => null,
            'estado' => 'stopped',
        ]);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->id}/pagar-transferencia");

        expect($server->fresh()->billed_active_ms)->toBe($billedMs);
    });

    it('returns error when pending payment already exists', function () {
        $server = makeClientServer($this->client, [
            'active_ms' => 40 * 24 * 60 * 60 * 1000,
            'billed_active_ms' => 30 * 24 * 60 * 60 * 1000,
            'latest_release' => null,
            'estado' => 'stopped',
        ]);

        PagoMensual::create([
            'server_id' => $server->id,
            'anio' => now()->year,
            'mes' => now()->month,
            'monto' => 10.00,
            'estado' => 'pendiente',
        ]);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->id}/pagar-transferencia")
            ->assertSessionHasErrors('payment');
    });

    it('returns error when debt is less than 1 day', function () {
        $server = makeClientServer($this->client, [
            'active_ms' => 0,
            'billed_active_ms' => 30 * 24 * 60 * 60 * 1000,
            'latest_release' => null,
            'estado' => 'stopped',
        ]);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->id}/pagar-transferencia")
            ->assertSessionHasErrors('payment');
    });
});

// ──────────────────────────────
// PAGAR MENSUALIDAD
// ──────────────────────────────

describe('pagarMensualidad', function () {
    it('requires client authentication', function () {
        $server = makeClientServer($this->client);

        $this->post("/client/servers/{$server->id}/pagar-mensualidad", [
            'medio_pago' => 'transferencia_bancaria',
        ])->assertRedirect('/client/login');
    });

    it('returns 404 when server belongs to another client', function () {
        $server = makeClientServer($this->otherClient);

        $this->actingAs($this->client, 'client')
            ->postJson("/client/servers/{$server->id}/pagar-mensualidad", [
                'medio_pago' => 'transferencia_bancaria',
            ])->assertNotFound();
    });

    it('creates a pending PagoMensual for transferencia_bancaria', function () {
        $server = makeClientServer($this->client, [
            'costo_diario' => 3.00,
        ]);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->id}/pagar-mensualidad", [
                'medio_pago' => 'transferencia_bancaria',
            ])->assertRedirect();

        $pago = PagoMensual::where('server_id', $server->id)->where('estado', 'pendiente')->first();
        expect($pago)->not->toBeNull();
        expect((float) $pago->monto)->toBe(90.0); // 3.00 * 30
        expect($pago->fecha_pago)->toBeNull();
    });

    it('does not update billed_active_ms for transferencia_bancaria', function () {
        $billedMs = 30 * 24 * 60 * 60 * 1000;
        $server = makeClientServer($this->client, [
            'billed_active_ms' => $billedMs,
        ]);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->id}/pagar-mensualidad", [
                'medio_pago' => 'transferencia_bancaria',
            ]);

        expect($server->fresh()->billed_active_ms)->toBe($billedMs);
    });

    it('returns error when pending payment already exists for transferencia_bancaria', function () {
        $server = makeClientServer($this->client);

        PagoMensual::create([
            'server_id' => $server->id,
            'anio' => now()->year,
            'mes' => now()->month,
            'monto' => 60.00,
            'estado' => 'pendiente',
        ]);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->id}/pagar-mensualidad", [
                'medio_pago' => 'transferencia_bancaria',
            ])->assertSessionHasErrors('payment');
    });

    it('validates required medio_pago field', function () {
        $server = makeClientServer($this->client);

        $this->actingAs($this->client, 'client')
            ->postJson("/client/servers/{$server->id}/pagar-mensualidad", [])
            ->assertJsonValidationErrors(['medio_pago']);
    });

    it('requires card fields when medio_pago is tarjeta_credito', function () {
        $server = makeClientServer($this->client);

        $this->actingAs($this->client, 'client')
            ->postJson("/client/servers/{$server->id}/pagar-mensualidad", [
                'medio_pago' => 'tarjeta_credito',
            ])->assertJsonValidationErrors(['token', 'installments']);
    });
});

// ──────────────────────────────
// VALIDAR PAGO (admin)
// ──────────────────────────────

describe('validarPago (admin)', function () {
    it('validates a pending payment and credits billed_active_ms', function () {
        $admin = User::factory()->create();
        $server = makeClientServer($this->client, [
            'costo_diario' => 2.00,
            'billed_active_ms' => 30 * 24 * 60 * 60 * 1000,
        ]);

        $pago = PagoMensual::create([
            'server_id' => $server->id,
            'anio' => now()->year,
            'mes' => now()->month,
            'monto' => 20.00, // 10 days * $2
            'estado' => 'pendiente',
        ]);

        $this->actingAs($admin)
            ->post("/admin/activos/{$server->id}/pagos/{$pago->id}/validar")
            ->assertRedirect();

        $freshPago = $pago->fresh();
        expect($freshPago->estado)->toBe('pagado');
        expect($freshPago->fecha_pago)->not->toBeNull();

        $freshServer = $server->fresh();
        $creditedMs = (int) round((20.0 / 2.0) * 86_400_000); // 10 days
        expect($freshServer->billed_active_ms)->toBe(30 * 24 * 60 * 60 * 1000 + $creditedMs);
    });

    it('returns 404 when pago does not belong to server', function () {
        $admin = User::factory()->create();
        $otherServer = makeClientServer($this->otherClient);
        $server = makeClientServer($this->client);

        $pago = PagoMensual::create([
            'server_id' => $otherServer->id,
            'anio' => now()->year,
            'mes' => now()->month,
            'monto' => 10.00,
            'estado' => 'pendiente',
        ]);

        $this->actingAs($admin)
            ->post("/admin/activos/{$server->id}/pagos/{$pago->id}/validar")
            ->assertNotFound();
    });
});
