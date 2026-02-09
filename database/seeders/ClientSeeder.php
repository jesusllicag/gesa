<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class ClientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();
        $clientRole = Role::where('slug', 'clients')->where('guard_name', 'client')->first();

        $clients = Client::factory()
            ->count(5)
            ->create([
                'password' => 'password',
                'must_change_password' => false,
                'created_by' => $user->id,
            ]);

        if ($clientRole) {
            $clients->each(fn (Client $client) => $client->assignRole($clientRole));
        }
    }
}
