<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Permission::firstOrCreate(['name' => 'Listar Servidores', 'slug' => 'list.servers']);
    Permission::firstOrCreate(['name' => 'Crear Servidores', 'slug' => 'create.servers']);
    Permission::firstOrCreate(['name' => 'Actualizar Servidores', 'slug' => 'update.servers']);
    Permission::firstOrCreate(['name' => 'Eliminar Servidores', 'slug' => 'delete.servers']);
    Permission::firstOrCreate(['name' => 'Detener Servidores', 'slug' => 'stop.servers']);
    Permission::firstOrCreate(['name' => 'Iniciar Servidores', 'slug' => 'run.servers']);
});

describe('server permissions sharing', function () {
    it('shares all server permissions as true for user with all permissions', function () {
        $role = Role::firstOrCreate(['name' => 'Admin', 'slug' => 'admin']);
        $role->syncPermissions(Permission::all());

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->actingAs($user)
            ->get('/servers')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('permissions')
                ->where('permissions.canCreate', true)
                ->where('permissions.canUpdate', true)
                ->where('permissions.canDelete', true)
                ->where('permissions.canStop', true)
                ->where('permissions.canRun', true)
            );
    });

    it('shares server permissions as false for user without permissions', function () {
        $role = Role::firstOrCreate(['name' => 'Viewer', 'slug' => 'viewer']);
        $role->syncPermissions(['Listar Servidores']);

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->actingAs($user)
            ->get('/servers')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('permissions')
                ->where('permissions.canCreate', false)
                ->where('permissions.canUpdate', false)
                ->where('permissions.canDelete', false)
                ->where('permissions.canStop', false)
                ->where('permissions.canRun', false)
            );
    });

    it('shares only granted server permissions as true', function () {
        $role = Role::firstOrCreate(['name' => 'Operator', 'slug' => 'operator']);
        $role->syncPermissions(['Listar Servidores', 'Actualizar Servidores', 'Iniciar Servidores', 'Detener Servidores']);

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->actingAs($user)
            ->get('/servers')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('permissions')
                ->where('permissions.canCreate', false)
                ->where('permissions.canUpdate', true)
                ->where('permissions.canDelete', false)
                ->where('permissions.canStop', true)
                ->where('permissions.canRun', true)
            );
    });
});
