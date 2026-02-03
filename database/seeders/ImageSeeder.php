<?php

namespace Database\Seeders;

use App\Models\Image;
use App\Models\OperatingSystem;
use Illuminate\Database\Seeder;

class ImageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ubuntu = OperatingSystem::where('slug', 'ubuntu')->first();
        $windows = OperatingSystem::where('slug', 'windows')->first();
        $macos = OperatingSystem::where('slug', 'macos')->first();
        $rhel = OperatingSystem::where('slug', 'rhel')->first();
        $debian = OperatingSystem::where('slug', 'debian')->first();
        $amazonLinux = OperatingSystem::where('slug', 'amazon-linux')->first();

        $images = [
            // Ubuntu
            [
                'operating_system_id' => $ubuntu->id,
                'nombre' => 'Ubuntu Server 24.04 LTS',
                'version' => '24.04',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-0c7217cdde317cfec',
                'descripcion' => 'Canonical, Ubuntu, 24.04 LTS, amd64 noble image',
            ],
            [
                'operating_system_id' => $ubuntu->id,
                'nombre' => 'Ubuntu Server 22.04 LTS',
                'version' => '22.04',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-0fc5d935ebf8bc3bc',
                'descripcion' => 'Canonical, Ubuntu, 22.04 LTS, amd64 jammy image',
            ],
            [
                'operating_system_id' => $ubuntu->id,
                'nombre' => 'Ubuntu Server 20.04 LTS',
                'version' => '20.04',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-0261755bbcb8c4a84',
                'descripcion' => 'Canonical, Ubuntu, 20.04 LTS, amd64 focal image',
            ],
            // Windows
            [
                'operating_system_id' => $windows->id,
                'nombre' => 'Windows Server 2022 Base',
                'version' => '2022',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-0be0e902919675894',
                'descripcion' => 'Microsoft Windows Server 2022 Full Locale English AMI',
            ],
            [
                'operating_system_id' => $windows->id,
                'nombre' => 'Windows Server 2019 Base',
                'version' => '2019',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-0c2b0d3fb02824d92',
                'descripcion' => 'Microsoft Windows Server 2019 Full Locale English AMI',
            ],
            [
                'operating_system_id' => $windows->id,
                'nombre' => 'Windows Server 2016 Base',
                'version' => '2016',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-0b7b74ba8473ec232',
                'descripcion' => 'Microsoft Windows Server 2016 Full Locale English AMI',
            ],
            // macOS
            [
                'operating_system_id' => $macos->id,
                'nombre' => 'macOS Sonoma',
                'version' => '14.0',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-macos-sonoma-001',
                'descripcion' => 'Apple macOS Sonoma para EC2 Mac instances',
            ],
            [
                'operating_system_id' => $macos->id,
                'nombre' => 'macOS Ventura',
                'version' => '13.0',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-macos-ventura-001',
                'descripcion' => 'Apple macOS Ventura para EC2 Mac instances',
            ],
            [
                'operating_system_id' => $macos->id,
                'nombre' => 'macOS Monterey',
                'version' => '12.0',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-macos-monterey-001',
                'descripcion' => 'Apple macOS Monterey para EC2 Mac instances',
            ],
            // RHEL
            [
                'operating_system_id' => $rhel->id,
                'nombre' => 'RHEL 9',
                'version' => '9.3',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-0583d8c7a9c35822c',
                'descripcion' => 'Red Hat Enterprise Linux 9 (HVM), SSD Volume Type',
            ],
            [
                'operating_system_id' => $rhel->id,
                'nombre' => 'RHEL 8',
                'version' => '8.9',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-0c322300a1dd5dc79',
                'descripcion' => 'Red Hat Enterprise Linux 8 (HVM), SSD Volume Type',
            ],
            [
                'operating_system_id' => $rhel->id,
                'nombre' => 'RHEL 7',
                'version' => '7.9',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-0b0dcb5067f052a63',
                'descripcion' => 'Red Hat Enterprise Linux 7 (HVM), SSD Volume Type',
            ],
            // Debian
            [
                'operating_system_id' => $debian->id,
                'nombre' => 'Debian 12 (Bookworm)',
                'version' => '12',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-0c2d87e8ee0c7e77f',
                'descripcion' => 'Debian 12 (Bookworm) 64-bit (HVM), SSD Volume Type',
            ],
            [
                'operating_system_id' => $debian->id,
                'nombre' => 'Debian 11 (Bullseye)',
                'version' => '11',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-0e731c8a588258d0d',
                'descripcion' => 'Debian 11 (Bullseye) 64-bit (HVM), SSD Volume Type',
            ],
            [
                'operating_system_id' => $debian->id,
                'nombre' => 'Debian 10 (Buster)',
                'version' => '10',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-09d3b3274b6c5d4aa',
                'descripcion' => 'Debian 10 (Buster) 64-bit (HVM), SSD Volume Type',
            ],
            // Amazon Linux
            [
                'operating_system_id' => $amazonLinux->id,
                'nombre' => 'Amazon Linux 2023',
                'version' => '2023',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-0c101f26f147fa7fd',
                'descripcion' => 'Amazon Linux 2023 AMI, Kernel 6.1',
            ],
            [
                'operating_system_id' => $amazonLinux->id,
                'nombre' => 'Amazon Linux 2',
                'version' => '2',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-0230bd60aa48260c6',
                'descripcion' => 'Amazon Linux 2 AMI, Kernel 5.10',
            ],
            [
                'operating_system_id' => $amazonLinux->id,
                'nombre' => 'Amazon Linux 2 (ARM)',
                'version' => '2',
                'arquitectura' => '64-bit',
                'ami_id' => 'ami-0f34c5ae932e6f0e4',
                'descripcion' => 'Amazon Linux 2 AMI (HVM) - ARM64',
            ],
        ];

        foreach ($images as $image) {
            Image::create($image);
        }
    }
}
