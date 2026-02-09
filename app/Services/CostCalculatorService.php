<?php

namespace App\Services;

use App\Models\InstanceType;

class CostCalculatorService
{
    public function calcularCostoDiario(
        InstanceType $instanceType,
        int $ramGb,
        int $discoGb,
        string $discoTipo,
        string $conexion
    ): float {
        $costoInstancia = $instanceType->precio_hora * 24;

        $ramExtraGb = max(0, $ramGb - (float) $instanceType->memoria_gb);
        $costoRamExtra = $ramExtraGb * 0.005 * 24;

        $tarifaDiscoDia = $discoTipo === 'SSD' ? (0.08 / 30) : (0.045 / 30);
        $costoDisco = $discoGb * $tarifaDiscoDia;

        $surchargeConexion = $conexion === 'privada' ? 1.20 : 0;

        return round($costoInstancia + $costoRamExtra + $costoDisco + $surchargeConexion, 4);
    }
}
