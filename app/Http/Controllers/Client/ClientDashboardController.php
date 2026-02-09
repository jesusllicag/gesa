<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
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
            ->select('id', 'nombre', 'hostname', 'ip_address', 'entorno', 'estado', 'costo_diario', 'region_id', 'operating_system_id', 'instance_type_id', 'client_id')
            ->orderBy('nombre')
            ->get();

        return Inertia::render('client/dashboard', [
            'servers' => $servers,
        ]);
    }
}
