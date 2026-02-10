<?php

namespace App\Http\Controllers;

use App\Models\InstanceType;
use App\Models\Server;
use App\Models\SolicitudServidor;
use App\Services\CostCalculatorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SolicitudServidorController extends Controller
{
    public function __construct(private CostCalculatorService $costCalculator) {}

    public function index(): Response
    {
        $estado = request()->input('estado', 'pendiente');

        $query = SolicitudServidor::query()
            ->with([
                'client:id,nombre,email',
                'region:id,codigo,nombre',
                'operatingSystem:id,nombre,logo',
                'image:id,nombre,version,arquitectura',
                'instanceType:id,nombre,vcpus,memoria_gb',
                'reviewer:id,name',
            ]);

        if ($estado !== 'todas') {
            $query->where('estado', $estado);
        }

        $solicitudes = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('solicitudes/index', [
            'solicitudes' => $solicitudes,
            'filters' => [
                'estado' => $estado,
            ],
        ]);
    }

    public function approve(SolicitudServidor $solicitudServidor): RedirectResponse
    {
        if ($solicitudServidor->estado !== 'pendiente') {
            return back()->with('error', 'Solo se pueden aprobar solicitudes pendientes.');
        }

        $instanceType = InstanceType::findOrFail($solicitudServidor->instance_type_id);
        $costoDiario = $this->costCalculator->calcularCostoDiario(
            $instanceType,
            $solicitudServidor->ram_gb,
            $solicitudServidor->disco_gb,
            $solicitudServidor->disco_tipo,
            $solicitudServidor->conexion
        );

        $clavePrivada = null;
        if ($solicitudServidor->conexion === 'privada') {
            $clavePrivada = Str::random(32);
        }

        $ipAddress = sprintf('10.%d.%d.%d', rand(0, 255), rand(0, 255), rand(1, 254));

        Server::create([
            'nombre' => $solicitudServidor->nombre,
            'client_id' => $solicitudServidor->client_id,
            'region_id' => $solicitudServidor->region_id,
            'operating_system_id' => $solicitudServidor->operating_system_id,
            'image_id' => $solicitudServidor->image_id,
            'instance_type_id' => $solicitudServidor->instance_type_id,
            'ram_gb' => $solicitudServidor->ram_gb,
            'disco_gb' => $solicitudServidor->disco_gb,
            'disco_tipo' => $solicitudServidor->disco_tipo,
            'conexion' => $solicitudServidor->conexion,
            'clave_privada' => $clavePrivada,
            'estado' => 'pending',
            'costo_diario' => $costoDiario,
            'ip_address' => $ipAddress,
            'created_by' => auth()->id(),
        ]);

        $solicitudServidor->update([
            'estado' => 'aprobada',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return back()->with('success', 'Solicitud aprobada y servidor creado correctamente.');
    }

    public function reject(Request $request, SolicitudServidor $solicitudServidor): RedirectResponse
    {
        if ($solicitudServidor->estado !== 'pendiente') {
            return back()->with('error', 'Solo se pueden rechazar solicitudes pendientes.');
        }

        $request->validate([
            'motivo_rechazo' => ['required', 'string', 'max:1000'],
        ], [
            'motivo_rechazo.required' => 'El motivo de rechazo es obligatorio.',
        ]);

        $solicitudServidor->update([
            'estado' => 'rechazada',
            'motivo_rechazo' => $request->motivo_rechazo,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return back()->with('success', 'Solicitud rechazada correctamente.');
    }
}
