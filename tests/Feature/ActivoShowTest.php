<?php

use App\Models\Client;
use App\Models\Image;
use App\Models\InstanceType;
use App\Models\OperatingSystem;
use App\Models\Region;
use App\Models\Server;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->region = Region::factory()->create([
        'codigo' => 'us-east-1',
        'nombre' => 'US East (N. Virginia)',
    ]);
    $this->operatingSystem = OperatingSystem::factory()->create([
        'nombre' => 'Ubuntu',
        'slug' => 'ubuntu',
        'logo' => 'ubuntu',
    ]);
    $this->image = Image::factory()->create([
        'operating_system_id' => $this->operatingSystem->id,
        'nombre' => 'Ubuntu Server 24.04 LTS',
        'version' => '24.04',
        'arquitectura' => '64-bit',
    ]);
    $this->instanceType = InstanceType::factory()->create([
        'nombre' => 't2.micro',
        'familia' => 'T2',
        'vcpus' => 1,
        'memoria_gb' => 1,
    ]);
    $this->client = Client::factory()->create([
        'created_by' => $this->user->id,
    ]);
});

it('can display activo show page with server data', function () {
    $server = Server::factory()->create([
        'region_id' => $this->region->id,
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
        'client_id' => $this->client->id,
        'hostname' => 'web-prod-01',
        'ip_address' => '10.0.0.1',
        'entorno' => 'PROD',
        'estado' => 'running',
    ]);

    $response = $this->actingAs($this->user)->get(route('activos.show', $server));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('activos/show')
        ->has('server')
        ->has('activities')
        ->has('costoMensualEstimado')
        ->has('pagosPendientes')
        ->where('server.nombre', $server->nombre)
        ->where('server.hostname', 'web-prod-01')
    );
});

it('loads related client data', function () {
    $server = Server::factory()->create([
        'region_id' => $this->region->id,
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
        'client_id' => $this->client->id,
        'estado' => 'running',
    ]);

    $response = $this->actingAs($this->user)->get(route('activos.show', $server));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('activos/show')
        ->has('server.client')
        ->where('server.client.nombre', $this->client->nombre)
    );
});

it('requires authentication to access activo show', function () {
    $server = Server::factory()->create([
        'region_id' => $this->region->id,
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
        'client_id' => $this->client->id,
    ]);

    $response = $this->get(route('activos.show', $server));

    $response->assertRedirect(route('login'));
});

it('returns 404 for non-existent server', function () {
    $response = $this->actingAs($this->user)->get('/activos/non-existent-uuid');

    $response->assertNotFound();
});
