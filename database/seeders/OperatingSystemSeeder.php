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
                'logo' => '/storage/icons/ubuntu.svg',
            ],
            [
                'nombre' => 'Windows Server',
                'slug' => 'windows',
                'logo' => '/storage/icons/microsoft.svg',
            ],
            [
                'nombre' => 'macOS',
                'slug' => 'macos',
                'logo' => '/storage/icons/macos.svg',
            ],
            [
                'nombre' => 'Red Hat Enterprise Linux',
                'slug' => 'rhel',
                'logo' => '/storage/icons/red-hat.svg',
            ],
            [
                'nombre' => 'Debian',
                'slug' => 'debian',
                'logo' => '/storage/icons/debian.svg',
            ],
            [
                'nombre' => 'Amazon Linux',
                'slug' => 'amazon-linux',
                'logo' => '/storage/icons/amazon.svg',
            ],
        ];

        foreach ($operatingSystems as $os) {
            OperatingSystem::create($os);
        }
    }
}
