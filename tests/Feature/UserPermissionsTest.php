<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Permission::firstOrCreate(['name' => 'Listar Usuarios', 'slug' => 'list.users']);
    Permission::firstOrCreate(['name' => 'Crear Usuarios', 'slug' => 'create.users']);
    Permission::firstOrCreate(['name' => 'Actualizar Usuarios', 'slug' => 'update.users']);
    Permission::firstOrCreate(['name' => 'Eliminar Usuarios', 'slug' => 'delete.users']);
});

describe('user permissions sharing', function () {
    it('shares all user permissions as true for user with all permissions', function () {
        $role = Role::firstOrCreate(['name' => 'Admin', 'slug' => 'admin']);
        $role->syncPermissions(Permission::all());

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->actingAs($user)
            ->get('/users')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('userPermissions')
                ->where('userPermissions.canCreateUsers', true)
                ->where('userPermissions.canUpdateUsers', true)
                ->where('userPermissions.canDeleteUsers', true)
            );
    });

    it('shares user permissions as false for user without permissions', function () {
        $role = Role::firstOrCreate(['name' => 'Viewer', 'slug' => 'viewer']);
        $role->syncPermissions(['Listar Usuarios']);

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->actingAs($user)
            ->get('/users')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('userPermissions')
                ->where('userPermissions.canCreateUsers', false)
                ->where('userPermissions.canUpdateUsers', false)
                ->where('userPermissions.canDeleteUsers', false)
            );
    });

    it('shares only granted user permissions as true', function () {
        $role = Role::firstOrCreate(['name' => 'Manager', 'slug' => 'manager']);
        $role->syncPermissions(['Listar Usuarios', 'Crear Usuarios', 'Actualizar Usuarios']);

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->actingAs($user)
            ->get('/users')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('userPermissions')
                ->where('userPermissions.canCreateUsers', true)
                ->where('userPermissions.canUpdateUsers', true)
                ->where('userPermissions.canDeleteUsers', false)
            );
    });
});
