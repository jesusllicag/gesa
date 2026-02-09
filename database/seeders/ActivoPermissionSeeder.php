<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ActivoPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            ['name' => 'Listar Activos', 'slug' => 'list.activos'],
            ['name' => 'Crear Activos', 'slug' => 'create.activos'],
            ['name' => 'Actualizar Activos', 'slug' => 'update.activos'],
            ['name' => 'Eliminar Activos', 'slug' => 'delete.activos'],
        ];

        $created = [];
        foreach ($permissions as $permission) {
            $created[] = Permission::firstOrCreate(
                ['slug' => $permission['slug']],
                ['name' => $permission['name']],
            );
        }

        $adminRole = Role::where('slug', 'admin')->first();
        if ($adminRole) {
            $adminRole->givePermissionTo($created);
        }

        $managerRole = Role::where('slug', 'manager')->first();
        if ($managerRole) {
            $managerRole->givePermissionTo(
                collect($created)->filter(fn ($p) => in_array($p->slug, ['list.activos', 'update.activos']))
            );
        }
    }
}
