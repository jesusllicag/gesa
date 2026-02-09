<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSolicitudServidorRequest;
use App\Models\InstanceType;
use App\Models\SolicitudServidor;
use App\Services\CostCalculatorService;
use Illuminate\Http\RedirectResponse;

class ClientSolicitudController extends Controller
{
    public function __construct(private CostCalculatorService $costCalculator) {}

    public function store(StoreSolicitudServidorRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $instanceType = InstanceType::findOrFail($validated['instance_type_id']);
        $costoDiarioEstimado = $this->costCalculator->calcularCostoDiario(
            $instanceType,
            $validated['ram_gb'],
            $validated['disco_gb'],
            $validated['disco_tipo'],
            $validated['conexion']
        );

        SolicitudServidor::create([
            ...$validated,
            'client_id' => auth('client')->id(),
            'costo_diario_estimado' => $costoDiarioEstimado,
            'estado' => 'pendiente',
        ]);

        return back()->with('success', 'Solicitud enviada correctamente. Sera revisada por un administrador.');
    }
}
