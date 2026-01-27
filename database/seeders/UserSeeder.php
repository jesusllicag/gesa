<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::factory()->create(['name' => 'Test User', 'email' => 'test@example.com']);

        $adminRole = Role::create(['name' => 'admin']);
        $managerRole = Role::create(['name' => 'manager']);

        //Users
        $listUSer = Permission::create(['name' => 'list.users']);
        $createUser = Permission::create(['name' => 'create.users']);
        $updateUser = Permission::create(['name' => 'update.users']);
        $deleteUser = Permission::create(['name' => 'delete.users']);

        $adminRole->givePermissionTo($listUSer, $createUser, $updateUser, $deleteUser);
        $managerRole->givePermissionTo($listUSer, $createUser, $updateUser);

        $user->assignRole($adminRole);
    }
}
