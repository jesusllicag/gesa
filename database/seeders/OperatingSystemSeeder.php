<?php

namespace Database\Seeders;

use App\Models\OperatingSystem;
use Illuminate\Database\Seeder;

class OperatingSystemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $operatingSystems = [
            [
                'nombre' => 'Ubuntu',
                'slug' => 'ubuntu',
                'logo' => 'ubuntu',
            ],
            [
                'nombre' => 'Windows Server',
                'slug' => 'windows',
                'logo' => 'windows',
            ],
            [
                'nombre' => 'macOS',
                'slug' => 'macos',
                'logo' => 'apple',
            ],
            [
                'nombre' => 'Red Hat Enterprise Linux',
                'slug' => 'rhel',
                'logo' => 'redhat',
            ],
            [
                'nombre' => 'Debian',
                'slug' => 'debian',
                'logo' => 'debian',
            ],
            [
                'nombre' => 'Amazon Linux',
                'slug' => 'amazon-linux',
                'logo' => 'aws',
            ],
        ];

        foreach ($operatingSystems as $os) {
            OperatingSystem::create($os);
        }
    }
}
