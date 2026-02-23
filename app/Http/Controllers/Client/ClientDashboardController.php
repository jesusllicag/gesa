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
    /**
     * Show the client dashboard with assigned servers.
     */
    public function index(): Response
    {
        $client = auth('client')->user();

        $servers = $client->servers()
            ->with(['region:id,codigo,nombre', 'operatingSystem:id,nombre,logo', 'instanceType:id,nombre,vcpus,memoria_gb'])
            ->select('id', 'nombre', 'hostname', 'ip_address', 'entorno', 'estado', 'costo_diario', 'region_id', 'operating_system_id', 'instance_type_id', 'client_id', 'token_aprobacion')
            ->orderBy('nombre')
            ->get();

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
        ]);
    }
}
