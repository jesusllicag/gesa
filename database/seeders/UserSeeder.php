<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::factory()->create(['name' => 'Admin', 'email' => 'test@example.com']);
        $managerUser = User::factory()->create(['name' => 'Manager', 'email' => 'manager@example.com']);
        $adminRole = Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $managerRole = Role::create(['name' => 'Manager', 'slug' => 'manager']);

        // Users
        $listUSer = Permission::create(['name' => 'Listar Usuarios', 'slug' => 'list.users']);
        $createUser = Permission::create(['name' => 'Crear Usuarios', 'slug' => 'create.users']);
        $updateUser = Permission::create(['name' => 'Actualizar Usuarios', 'slug' => 'update.users']);
        $deleteUser = Permission::create(['name' => 'Eliminar Usuarios', 'slug' => 'delete.users']);

        $adminRole->givePermissionTo($listUSer, $createUser, $updateUser, $deleteUser);
        $managerRole->givePermissionTo($listUSer, $createUser, $updateUser);

        // Servers
        $listServer = Permission::create(['name' => 'Listar Servidores', 'slug' => 'list.servers']);
        $createServer = Permission::create(['name' => 'Crear Servidores', 'slug' => 'create.servers']);
        $updateServer = Permission::create(['name' => 'Actualizar Servidores', 'slug' => 'update.servers']);
        $deleteServer = Permission::create(['name' => 'Eliminar Servidores', 'slug' => 'delete.servers']);
        $runServer = Permission::create(['name' => 'Ejecutar Servidores', 'slug' => 'run.servers']);
        $stopServer = Permission::create(['name' => 'Detener Servidores', 'slug' => 'stop.servers']);
        $adminRole->givePermissionTo($listServer, $createServer, $updateServer, $deleteServer, $runServer, $stopServer);
        $managerRole->givePermissionTo($listServer, $updateServer, $runServer, $stopServer);

        // Activos
        $listActivo = Permission::create(['name' => 'Listar Activos', 'slug' => 'list.activos']);
        $createActivo = Permission::create(['name' => 'Crear Activos', 'slug' => 'create.activos']);
        $updateActivo = Permission::create(['name' => 'Actualizar Activos', 'slug' => 'update.activos']);
        $deleteActivo = Permission::create(['name' => 'Eliminar Activos', 'slug' => 'delete.activos']);
        $adminRole->givePermissionTo($listActivo, $createActivo, $updateActivo, $deleteActivo);
        $managerRole->givePermissionTo($listActivo, $updateActivo);

        // Clients
        $listClient = Permission::create(['name' => 'Listar Clientes', 'slug' => 'list.clients']);
        $createClient = Permission::create(['name' => 'Crear Clientes', 'slug' => 'create.clients']);
        $updateClient = Permission::create(['name' => 'Actualizar Clientes', 'slug' => 'update.clients']);
        $deleteClient = Permission::create(['name' => 'Eliminar Clientes', 'slug' => 'delete.clients']);
        $adminRole->givePermissionTo($listClient, $createClient, $updateClient, $deleteClient);
        $managerRole->givePermissionTo($listClient, $updateClient);

        // Policies
        $listPolicy = Permission::create(['name' => 'Listar Politicas', 'slug' => 'list.policies']);
        $createPolicy = Permission::create(['name' => 'Crear Politicas', 'slug' => 'create.policies']);
        $updatePolicy = Permission::create(['name' => 'Actualizar Politicas', 'slug' => 'update.policies']);
        $deletePolicy = Permission::create(['name' => 'Eliminar Politicas', 'slug' => 'delete.policies']);
        $adminRole->givePermissionTo($listPolicy, $createPolicy, $updatePolicy, $deletePolicy);

        $user->assignRole($adminRole);
        $managerUser->assignRole($managerRole);
    }
}
