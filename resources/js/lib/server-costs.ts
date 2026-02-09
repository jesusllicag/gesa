export interface CostBreakdown {
    costoInstancia: number;
    costoRamExtra: number;
    costoDisco: number;
    surchargeConexion: number;
    total: number;
}

export interface InstanceTypeForCost {
    precio_hora: number;
    memoria_gb: number;
}

export function calcularCostoDiario(
    instanceType: InstanceTypeForCost | undefined,
    ramGb: number,
    discoGb: number,
    discoTipo: 'SSD' | 'HDD',
    conexion: 'publica' | 'privada',
): CostBreakdown {
    if (!instanceType) {
        return { costoInstancia: 0, costoRamExtra: 0, costoDisco: 0, surchargeConexion: 0, total: 0 };
    }

    const costoInstancia = Number(instanceType.precio_hora) * 24;
    const ramExtraGb = Math.max(0, ramGb - Number(instanceType.memoria_gb));
    const costoRamExtra = ramExtraGb * 0.005 * 24;
    const tarifaDiscoDia = discoTipo === 'SSD' ? 0.08 / 30 : 0.045 / 30;
    const costoDisco = discoGb * tarifaDiscoDia;
    const surchargeConexion = conexion === 'privada' ? 1.2 : 0;
    const total = costoInstancia + costoRamExtra + costoDisco + surchargeConexion;

    return { costoInstancia, costoRamExtra, costoDisco, surchargeConexion, total };
}
