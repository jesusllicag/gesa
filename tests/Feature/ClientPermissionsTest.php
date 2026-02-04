<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Permission::firstOrCreate(['name' => 'Listar Clientes', 'slug' => 'list.clients']);
    Permission::firstOrCreate(['name' => 'Crear Clientes', 'slug' => 'create.clients']);
    Permission::firstOrCreate(['name' => 'Actualizar Clientes', 'slug' => 'update.clients']);
    Permission::firstOrCreate(['name' => 'Eliminar Clientes', 'slug' => 'delete.clients']);
});

describe('client permissions sharing', function () {
    it('shares all client permissions as true for user with all permissions', function () {
        $role = Role::firstOrCreate(['name' => 'Admin', 'slug' => 'admin']);
        $role->syncPermissions(Permission::all());

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->actingAs($user)
            ->get('/clients')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('permissions')
                ->where('permissions.canCreate', true)
                ->where('permissions.canUpdate', true)
                ->where('permissions.canDelete', true)
            );
    });

    it('shares client permissions as false for user without permissions', function () {
        $role = Role::firstOrCreate(['name' => 'Viewer', 'slug' => 'viewer']);
        $role->syncPermissions(['Listar Clientes']);

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->actingAs($user)
            ->get('/clients')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('permissions')
                ->where('permissions.canCreate', false)
                ->where('permissions.canUpdate', false)
                ->where('permissions.canDelete', false)
            );
    });

    it('shares only granted client permissions as true', function () {
        $role = Role::firstOrCreate(['name' => 'Manager', 'slug' => 'manager']);
        $role->syncPermissions(['Listar Clientes', 'Actualizar Clientes']);

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->actingAs($user)
            ->get('/clients')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('permissions')
                ->where('permissions.canCreate', false)
                ->where('permissions.canUpdate', true)
                ->where('permissions.canDelete', false)
            );
    });
});
