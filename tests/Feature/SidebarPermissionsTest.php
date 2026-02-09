<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Permission::firstOrCreate(['name' => 'Listar Clientes', 'slug' => 'list.clients']);
    Permission::firstOrCreate(['name' => 'Listar Servidores', 'slug' => 'list.servers']);
    Permission::firstOrCreate(['name' => 'Listar Politicas', 'slug' => 'list.policies']);
    Permission::firstOrCreate(['name' => 'Listar Usuarios', 'slug' => 'list.users']);
});

describe('sidebar permissions sharing', function () {
    it('shares all permissions as true for user with all permissions', function () {
        $role = Role::firstOrCreate(['name' => 'Admin', 'slug' => 'admin']);
        $role->syncPermissions(Permission::all());

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->actingAs($user)
            ->get('/admin/dashboard')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('sidebarPermissions')
                ->where('sidebarPermissions.canListClients', true)
                ->where('sidebarPermissions.canListServers', true)
                ->where('sidebarPermissions.canListPolicies', true)
                ->where('sidebarPermissions.canListUsers', true)
            );
    });

    it('shares permissions as false for user without permissions', function () {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/admin/dashboard')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('sidebarPermissions')
                ->where('sidebarPermissions.canListClients', false)
                ->where('sidebarPermissions.canListServers', false)
                ->where('sidebarPermissions.canListPolicies', false)
                ->where('sidebarPermissions.canListUsers', false)
            );
    });

    it('shares only granted permissions as true', function () {
        $role = Role::firstOrCreate(['name' => 'Limited', 'slug' => 'limited']);
        $role->syncPermissions(['Listar Clientes', 'Listar Servidores']);

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->actingAs($user)
            ->get('/admin/dashboard')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('sidebarPermissions')
                ->where('sidebarPermissions.canListClients', true)
                ->where('sidebarPermissions.canListServers', true)
                ->where('sidebarPermissions.canListPolicies', false)
                ->where('sidebarPermissions.canListUsers', false)
            );
    });
});
