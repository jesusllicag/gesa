<?php

use App\Models\Client;
use App\Models\Image;
use App\Models\InstanceType;
use App\Models\OperatingSystem;
use App\Models\Region;
use App\Models\Server;
use App\Models\User;
use App\Notifications\ServidorAprobadoClienteNotification;
use App\Notifications\ServidorPendienteAprobacionNotification;
use App\Notifications\ServidorRechazadoClienteNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->client = Client::factory()->create(['must_change_password' => false]);
    $this->admin = User::factory()->create();
    $this->region = Region::factory()->create();
    $this->os = OperatingSystem::factory()->create();
    $this->image = Image::factory()->create(['operating_system_id' => $this->os->id]);
    $this->instanceType = InstanceType::factory()->create(['precio_hora' => 0.10, 'memoria_gb' => 4]);
});

function makePendienteServer(Client $client, Region $region, OperatingSystem $os, Image $image, InstanceType $instanceType, array $attrs = []): Server
{
    return Server::factory()->create(array_merge([
        'client_id' => $client->id,
        'estado' => 'pendiente_aprobacion',
        'token_aprobacion' => Str::random(64),
        'region_id' => $region->id,
        'operating_system_id' => $os->id,
        'image_id' => $image->id,
        'instance_type_id' => $instanceType->id,
    ], $attrs));
}

describe('show', function () {
    it('requires client authentication', function () {
        $server = makePendienteServer($this->client, $this->region, $this->os, $this->image, $this->instanceType);

        $this->get("/client/servers/{$server->token_aprobacion}/review")
            ->assertRedirect('/client/login');
    });

    it('renders the approval page for a valid token', function () {
        $server = makePendienteServer($this->client, $this->region, $this->os, $this->image, $this->instanceType);

        $this->actingAs($this->client, 'client')
            ->get("/client/servers/{$server->token_aprobacion}/review")
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('client/server-approval')
                ->has('server')
                ->has('mercadopago_public_key')
            );
    });

    it('returns 404 for an invalid token', function () {
        $this->actingAs($this->client, 'client')
            ->get('/client/servers/token-inexistente/review')
            ->assertNotFound();
    });

    it('returns 404 if the server belongs to a different client', function () {
        $otherClient = Client::factory()->create(['must_change_password' => false]);
        $server = makePendienteServer($otherClient, $this->region, $this->os, $this->image, $this->instanceType);

        $this->actingAs($this->client, 'client')
            ->get("/client/servers/{$server->token_aprobacion}/review")
            ->assertNotFound();
    });

    it('returns 404 if the server is not in pendiente_aprobacion state', function () {
        $server = Server::factory()->create([
            'client_id' => $this->client->id,
            'estado' => 'pending',
            'token_aprobacion' => Str::random(64),
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
        ]);

        $this->actingAs($this->client, 'client')
            ->get("/client/servers/{$server->token_aprobacion}/review")
            ->assertNotFound();
    });
});

describe('approve with transferencia', function () {
    it('requires client authentication', function () {
        $server = makePendienteServer($this->client, $this->region, $this->os, $this->image, $this->instanceType);

        $this->post("/client/servers/{$server->token_aprobacion}/approve", ['medio_pago' => 'transferencia_bancaria'])
            ->assertRedirect('/client/login');
    });

    it('approves the server with transferencia bancaria', function () {
        Notification::fake();

        $server = makePendienteServer($this->client, $this->region, $this->os, $this->image, $this->instanceType);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->token_aprobacion}/approve", ['medio_pago' => 'transferencia_bancaria'])
            ->assertRedirect(route('client.dashboard'));

        $server->refresh();
        expect($server->estado)->toBe('pending');
        expect($server->token_aprobacion)->toBeNull();

        Notification::assertSentTo($this->client, ServidorAprobadoClienteNotification::class);
    });

    it('redirects to dashboard with success message after approval', function () {
        Notification::fake();
        $server = makePendienteServer($this->client, $this->region, $this->os, $this->image, $this->instanceType);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->token_aprobacion}/approve", ['medio_pago' => 'transferencia_bancaria'])
            ->assertRedirect(route('client.dashboard'))
            ->assertSessionHas('success');
    });

    it('returns 404 for an invalid token on approve', function () {
        $this->actingAs($this->client, 'client')
            ->post('/client/servers/token-invalido/approve', ['medio_pago' => 'transferencia_bancaria'])
            ->assertNotFound();
    });

    it('validates medio_pago is required', function () {
        $server = makePendienteServer($this->client, $this->region, $this->os, $this->image, $this->instanceType);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->token_aprobacion}/approve", [])
            ->assertSessionHasErrors(['medio_pago']);
    });

    it('validates medio_pago must be valid', function () {
        $server = makePendienteServer($this->client, $this->region, $this->os, $this->image, $this->instanceType);

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$server->token_aprobacion}/approve", ['medio_pago' => 'paypal'])
            ->assertSessionHasErrors(['medio_pago']);
    });
});

describe('reject', function () {
    it('requires client authentication', function () {
        $server = makePendienteServer($this->client, $this->region, $this->os, $this->image, $this->instanceType);

        $this->post("/client/servers/{$server->token_aprobacion}/reject")
            ->assertRedirect('/client/login');
    });

    it('soft deletes the server and redirects to dashboard', function () {
        Notification::fake();

        $server = makePendienteServer($this->client, $this->region, $this->os, $this->image, $this->instanceType);
        $token = $server->token_aprobacion;

        $this->actingAs($this->client, 'client')
            ->post("/client/servers/{$token}/reject")
            ->assertRedirect(route('client.dashboard'))
            ->assertSessionHas('success');

        $this->assertSoftDeleted('servers', ['id' => $server->id]);

        $server->refresh();
        expect($server->estado)->toBe('terminated');
        expect($server->token_aprobacion)->toBeNull();

        Notification::assertSentTo($this->client, ServidorRechazadoClienteNotification::class);
    });

    it('returns 404 for an invalid token on reject', function () {
        $this->actingAs($this->client, 'client')
            ->post('/client/servers/token-invalido/reject')
            ->assertNotFound();
    });
});

describe('admin assigns existing server to client via activos', function () {
    it('sets pendiente_aprobacion and sends notification when assigning server to client', function () {
        Notification::fake();

        $server = Server::factory()->create([
            'client_id' => null,
            'estado' => 'pending',
            'token_aprobacion' => null,
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
        ]);

        $this->actingAs($this->admin)->post(route('activos.store'), [
            'server_id' => $server->id,
            'client_id' => $this->client->id,
            'hostname' => 'web-prod-01',
            'entorno' => 'PROD',
        ])->assertRedirect();

        $server->refresh();
        expect($server->estado)->toBe('pendiente_aprobacion');
        expect($server->token_aprobacion)->not->toBeNull();
        expect($server->client_id)->toBe($this->client->id);

        Notification::assertSentTo($this->client, ServidorPendienteAprobacionNotification::class);
    });
});

describe('admin creates server with client assignment', function () {
    it('sends notification when admin creates server with client_id', function () {
        Notification::fake();

        $this->actingAs($this->admin)->post(route('servers.store'), [
            'nombre' => 'servidor-asignado',
            'client_id' => $this->client->id,
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
            'ram_gb' => 4,
            'disco_gb' => 50,
            'disco_tipo' => 'SSD',
            'conexion' => 'publica',
        ])->assertRedirect();

        $server = Server::where('nombre', 'servidor-asignado')->first();
        expect($server)->not->toBeNull();
        expect($server->estado)->toBe('pendiente_aprobacion');
        expect($server->token_aprobacion)->not->toBeNull();

        Notification::assertSentTo($this->client, ServidorPendienteAprobacionNotification::class);
    });

    it('does not send notification when admin creates server without client_id', function () {
        Notification::fake();

        $this->actingAs($this->admin)->post(route('servers.store'), [
            'nombre' => 'servidor-sin-cliente',
            'region_id' => $this->region->id,
            'operating_system_id' => $this->os->id,
            'image_id' => $this->image->id,
            'instance_type_id' => $this->instanceType->id,
            'ram_gb' => 4,
            'disco_gb' => 50,
            'disco_tipo' => 'SSD',
            'conexion' => 'publica',
        ])->assertRedirect();

        $server = Server::where('nombre', 'servidor-sin-cliente')->first();
        expect($server->estado)->toBe('pending');
        expect($server->token_aprobacion)->toBeNull();

        Notification::assertNothingSent();
    });
});
