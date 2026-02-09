import { DollarSignIcon } from 'lucide-react';

import { type CostBreakdown } from '@/lib/server-costs';

export function CostPreview({ desglose }: { desglose: CostBreakdown }) {
    if (desglose.total === 0) {
        return null;
    }

    return (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/50">
            <div className="mb-2 flex items-center gap-2">
                <DollarSignIcon className="size-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Costo Estimado Diario</span>
            </div>
            <div className="space-y-1 text-sm">
                <div className="flex justify-between text-blue-700 dark:text-blue-300">
                    <span>Instancia (24h)</span>
                    <span>${desglose.costoInstancia.toFixed(4)}</span>
                </div>
                {desglose.costoRamExtra > 0 && (
                    <div className="flex justify-between text-blue-700 dark:text-blue-300">
                        <span>RAM adicional</span>
                        <span>${desglose.costoRamExtra.toFixed(4)}</span>
                    </div>
                )}
                <div className="flex justify-between text-blue-700 dark:text-blue-300">
                    <span>Almacenamiento</span>
                    <span>${desglose.costoDisco.toFixed(4)}</span>
                </div>
                {desglose.surchargeConexion > 0 && (
                    <div className="flex justify-between text-blue-700 dark:text-blue-300">
                        <span>Conexion privada</span>
                        <span>${desglose.surchargeConexion.toFixed(4)}</span>
                    </div>
                )}
                <div className="flex justify-between border-t border-blue-200 pt-1 font-semibold text-blue-900 dark:border-blue-700 dark:text-blue-100">
                    <span>Total / dia</span>
                    <span>${desglose.total.toFixed(4)}</span>
                </div>
            </div>
        </div>
    );
}
