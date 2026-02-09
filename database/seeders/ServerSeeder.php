<?php

namespace Database\Seeders;

use App\Models\Image;
use App\Models\InstanceType;
use App\Models\Region;
use App\Models\Server;
use App\Models\User;
use Illuminate\Database\Seeder;

class ServerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();
        $regions = Region::all();
        $images = Image::all();
        $instanceTypes = InstanceType::all();
        Server::factory()
            ->count(10)
            ->sequence(fn () => [
                'region_id' => $regions->random()->id,
                'image_id' => ($image = $images->random())->id,
                'operating_system_id' => $image->operating_system_id,
                'costo_diario' => $this->calcularCostoDiario($instanceType = $instanceTypes->random(), 'SSD', 'publica'),
                'instance_type_id' => $instanceType->id,
                'disco_tipo' => 'SSD',
                'conexion' => 'publica',
                'created_by' => $user->id,
                'client_id' => null,
                'estado' => 'pending',
            ])
            ->create();
    }

    private function calcularCostoDiario(
        InstanceType $instanceType,
        string $discoTipo,
        string $conexion
    ): float {
        $costoInstancia = $instanceType->precio_hora * 24;

        $tarifaDiscoDia = $discoTipo === 'SSD' ? (0.08 / 30) : (0.045 / 30);
        $costoDisco = $instanceType->memoria_gb * $tarifaDiscoDia;

        $surchargeConexion = $conexion === 'privada' ? 1.20 : 0;

        return round($costoInstancia + $costoDisco + $surchargeConexion, 4);
    }
}
