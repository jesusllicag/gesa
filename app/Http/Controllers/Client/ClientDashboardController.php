<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\InstanceType;
use App\Models\OperatingSystem;
use App\Models\Region;
use Inertia\Inertia;
use Inertia\Response;

class ClientDashboardController extends Controller
{
    /** Minimum billable active time in milliseconds (1 day). */
    private const MIN_BILLABLE_MS = 86_400_000;

    /** Maximum payable debt in days. */
    private const MAX_PAYABLE_DAYS = 30;

    /**
     * Show the client dashboard with assigned servers.
     */
    public function index(): Response
    {
        $client = auth('client')->user();

        $servers = $client->servers()
            ->with(['region:id,codigo,nombre', 'operatingSystem:id,nombre,logo', 'instanceType:id,nombre,vcpus,memoria_gb'])
            ->withCount(['pagosMensuales as pagos_pendientes_count' => fn ($q) => $q->where('estado', 'pendiente')])
            ->select('id', 'nombre', 'hostname', 'ip_address', 'entorno', 'estado', 'costo_diario', 'region_id', 'operating_system_id', 'instance_type_id', 'client_id', 'token_aprobacion', 'active_ms', 'billed_active_ms', 'latest_release', 'first_activated_at')
            ->orderBy('nombre')
            ->get()
            ->map(function ($server) {
                $currentActiveMs = $server->active_ms;
                if ($server->latest_release) {
                    $currentActiveMs += (int) now()->diffInMilliseconds($server->latest_release);
                }

                $pendingMs = max(0, $currentActiveMs - $server->billed_active_ms);
                $pendingDays = $pendingMs / 86_400_000;
                $daysToCharge = min($pendingDays, self::MAX_PAYABLE_DAYS);

                $server->deuda_pendiente = $pendingMs >= self::MIN_BILLABLE_MS
                    ? round($daysToCharge * (float) $server->costo_diario, 2)
                    : 0.0;

                $server->has_pago_pendiente = $server->pagos_pendientes_count > 0;

                return $server;
            });

        $solicitudes = $client->solicitudes()
            ->with([
                'region:id,codigo,nombre',
                'operatingSystem:id,nombre,logo',
                'instanceType:id,nombre,vcpus,memoria_gb',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        $operatingSystems = OperatingSystem::select('id', 'nombre', 'logo')
            ->with('images:id,operating_system_id,nombre,version,arquitectura,ami_id')
            ->get();

        $instanceTypes = InstanceType::select('id', 'nombre', 'familia', 'vcpus', 'procesador', 'memoria_gb', 'rendimiento_red', 'precio_hora')
            ->orderBy('familia')
            ->orderBy('memoria_gb')
            ->get();

        $regions = Region::select('id', 'codigo', 'nombre')->get();

        return Inertia::render('client/dashboard', [
            'servers' => $servers,
            'solicitudes' => $solicitudes,
            'operatingSystems' => $operatingSystems,
            'instanceTypes' => $instanceTypes,
            'regions' => $regions,
            'mercadopago_public_key' => config('mercadopago.public_key'),
            'bank_account' => config('bank'),
        ]);
    }
}
