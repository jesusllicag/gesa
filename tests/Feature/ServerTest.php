<?php

use App\Models\Image;
use App\Models\InstanceType;
use App\Models\OperatingSystem;
use App\Models\Server;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->user = User::factory()->create();
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

    // Create permissions
    Permission::firstOrCreate(['name' => 'Listar Servidores', 'slug' => 'list.servers']);
    Permission::firstOrCreate(['name' => 'Crear Servidores', 'slug' => 'create.servers']);
    Permission::firstOrCreate(['name' => 'Actualizar Servidores', 'slug' => 'update.servers']);
    Permission::firstOrCreate(['name' => 'Eliminar Servidores', 'slug' => 'delete.servers']);
    Permission::firstOrCreate(['name' => 'Ejecutar Servidores', 'slug' => 'run.servers']);
    Permission::firstOrCreate(['name' => 'Detener Servidores', 'slug' => 'stop.servers']);

    $adminRole = Role::firstOrCreate(['name' => 'Admin', 'slug' => 'admin']);
    $adminRole->syncPermissions(Permission::all());
    $this->user->assignRole($adminRole);
});

it('can display servers index page', function () {
    $response = $this->actingAs($this->user)->get(route('servers.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('servers/index')
        ->has('servers')
        ->has('operatingSystems')
        ->has('instanceTypes')
        ->has('permissions')
    );
});

it('can create a server with public connection', function () {
    $response = $this->actingAs($this->user)->post(route('servers.store'), [
        'nombre' => 'web-server-1',
        'region' => 'us-east-1',
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'ram_gb' => 4,
        'disco_gb' => 50,
        'disco_tipo' => 'SSD',
        'conexion' => 'publica',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('servers', [
        'nombre' => 'web-server-1',
        'region' => 'us-east-1',
        'conexion' => 'publica',
        'clave_privada' => null,
        'estado' => 'pending',
        'created_by' => $this->user->id,
    ]);
});

it('creates a private key when connection is private', function () {
    $response = $this->actingAs($this->user)->post(route('servers.store'), [
        'nombre' => 'private-server',
        'region' => 'sa-east-1',
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'ram_gb' => 8,
        'disco_gb' => 100,
        'disco_tipo' => 'SSD',
        'conexion' => 'privada',
    ]);

    $response->assertRedirect();

    $server = Server::where('nombre', 'private-server')->first();
    expect($server)->not->toBeNull();
    expect($server->conexion)->toBe('privada');
    expect($server->clave_privada)->not->toBeNull();
});

it('can delete a server', function () {
    $server = Server::factory()->create([
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->delete(route('servers.destroy', $server));

    $response->assertRedirect();

    $this->assertSoftDeleted('servers', [
        'id' => $server->id,
    ]);

    $server->refresh();
    expect($server->estado)->toBe('terminated');
});

it('validates required fields when creating a server', function () {
    $response = $this->actingAs($this->user)->post(route('servers.store'), []);

    $response->assertSessionHasErrors([
        'nombre',
        'region',
        'operating_system_id',
        'image_id',
        'instance_type_id',
        'ram_gb',
        'disco_gb',
        'disco_tipo',
        'conexion',
    ]);
});

it('validates region is valid', function () {
    $response = $this->actingAs($this->user)->post(route('servers.store'), [
        'nombre' => 'test-server',
        'region' => 'invalid-region',
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'ram_gb' => 4,
        'disco_gb' => 50,
        'disco_tipo' => 'SSD',
        'conexion' => 'publica',
    ]);

    $response->assertSessionHasErrors(['region']);
});

it('can search servers by name', function () {
    Server::factory()->create([
        'nombre' => 'production-web',
        'estado' => 'running',
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
    ]);

    Server::factory()->create([
        'nombre' => 'staging-api',
        'estado' => 'running',
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->get(route('servers.index', ['search' => 'production']));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('servers/index')
        ->has('servers.data', 1)
    );
});

it('requires authentication to access servers', function () {
    $response = $this->get(route('servers.index'));

    $response->assertRedirect(route('login'));
});

// Status filter tests
it('filters active servers by default', function () {
    Server::factory()->create([
        'nombre' => 'active-server',
        'estado' => 'running',
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
    ]);

    Server::factory()->create([
        'nombre' => 'stopped-server',
        'estado' => 'stopped',
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->get(route('servers.index'));

    $response->assertInertia(fn ($page) => $page
        ->has('servers.data', 1)
        ->where('servers.data.0.nombre', 'active-server')
    );
});

it('can filter inactive servers', function () {
    Server::factory()->create([
        'nombre' => 'active-server',
        'estado' => 'running',
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
    ]);

    Server::factory()->create([
        'nombre' => 'stopped-server',
        'estado' => 'stopped',
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->get(route('servers.index', ['status' => 'inactive']));

    $response->assertInertia(fn ($page) => $page
        ->has('servers.data', 1)
        ->where('servers.data.0.nombre', 'stopped-server')
    );
});

it('can filter all servers', function () {
    Server::factory()->create([
        'nombre' => 'active-server',
        'estado' => 'running',
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
    ]);

    Server::factory()->create([
        'nombre' => 'stopped-server',
        'estado' => 'stopped',
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->get(route('servers.index', ['status' => 'all']));

    $response->assertInertia(fn ($page) => $page
        ->has('servers.data', 2)
    );
});

// Update tests
it('can update server ram and disk', function () {
    $server = Server::factory()->create([
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
        'ram_gb' => 4,
        'disco_gb' => 50,
        'conexion' => 'publica',
    ]);

    $response = $this->actingAs($this->user)->put(route('servers.update', $server), [
        'ram_gb' => 8,
        'disco_gb' => 100,
        'conexion' => 'publica',
    ]);

    $response->assertRedirect();

    $server->refresh();
    expect($server->ram_gb)->toBe(8);
    expect($server->disco_gb)->toBe(100);
});

it('cannot reduce server ram', function () {
    $server = Server::factory()->create([
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
        'ram_gb' => 8,
        'disco_gb' => 100,
        'conexion' => 'publica',
    ]);

    $response = $this->actingAs($this->user)->put(route('servers.update', $server), [
        'ram_gb' => 4,
        'disco_gb' => 100,
        'conexion' => 'publica',
    ]);

    $response->assertSessionHasErrors(['ram_gb']);
});

it('cannot reduce server disk', function () {
    $server = Server::factory()->create([
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
        'ram_gb' => 8,
        'disco_gb' => 100,
        'conexion' => 'publica',
    ]);

    $response = $this->actingAs($this->user)->put(route('servers.update', $server), [
        'ram_gb' => 8,
        'disco_gb' => 50,
        'conexion' => 'publica',
    ]);

    $response->assertSessionHasErrors(['disco_gb']);
});

it('can change connection from public to private', function () {
    $server = Server::factory()->create([
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
        'conexion' => 'publica',
        'clave_privada' => null,
    ]);

    $response = $this->actingAs($this->user)->put(route('servers.update', $server), [
        'ram_gb' => $server->ram_gb,
        'disco_gb' => $server->disco_gb,
        'conexion' => 'privada',
    ]);

    $response->assertRedirect();

    $server->refresh();
    expect($server->conexion)->toBe('privada');
    expect($server->clave_privada)->not->toBeNull();
});

it('can change connection from private to public', function () {
    $server = Server::factory()->create([
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
        'conexion' => 'privada',
        'clave_privada' => 'some-key',
    ]);

    $response = $this->actingAs($this->user)->put(route('servers.update', $server), [
        'ram_gb' => $server->ram_gb,
        'disco_gb' => $server->disco_gb,
        'conexion' => 'publica',
    ]);

    $response->assertRedirect();

    $server->refresh();
    expect($server->conexion)->toBe('publica');
    expect($server->clave_privada)->toBeNull();
});

// Start/Stop tests
it('can stop a running server', function () {
    $server = Server::factory()->create([
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
        'estado' => 'running',
    ]);

    $response = $this->actingAs($this->user)->post(route('servers.stop', $server));

    $response->assertRedirect();

    $server->refresh();
    expect($server->estado)->toBe('stopped');
});

it('cannot stop a stopped server', function () {
    $server = Server::factory()->create([
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
        'estado' => 'stopped',
    ]);

    $response = $this->actingAs($this->user)->post(route('servers.stop', $server));

    $response->assertRedirect();
    $response->assertSessionHas('error');
});

it('can start a stopped server', function () {
    $server = Server::factory()->create([
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
        'estado' => 'stopped',
    ]);

    $response = $this->actingAs($this->user)->post(route('servers.start', $server));

    $response->assertRedirect();

    $server->refresh();
    expect($server->estado)->toBe('running');
});

it('can start a pending server', function () {
    $server = Server::factory()->create([
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
        'estado' => 'pending',
    ]);

    $response = $this->actingAs($this->user)->post(route('servers.start', $server));

    $response->assertRedirect();

    $server->refresh();
    expect($server->estado)->toBe('running');
});

it('cannot start a running server', function () {
    $server = Server::factory()->create([
        'operating_system_id' => $this->operatingSystem->id,
        'image_id' => $this->image->id,
        'instance_type_id' => $this->instanceType->id,
        'created_by' => $this->user->id,
        'estado' => 'running',
    ]);

    $response = $this->actingAs($this->user)->post(route('servers.start', $server));

    $response->assertRedirect();
    $response->assertSessionHas('error');
});
