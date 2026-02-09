<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreActivoRequest;
use App\Http\Requests\UpdateActivoRequest;
use App\Models\Client;
use App\Models\Server;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ActivoController extends Controller
{
    public function index(): Response
    {
        $search = request()->input('search', '');
        $status = request()->input('status', 'active');
        $clientId = request()->input('client_id', '');

        $query = Server::query()->whereNotNull('client_id');

        if ($status === 'all') {
            $query->withTrashed();
        } elseif ($status === 'inactive') {
            $query->withTrashed()->where(function ($q) {
                $q->whereIn('estado', ['stopped', 'terminated'])
                    ->orWhereNotNull('deleted_at');
            });
        } else {
            $query->whereIn('estado', ['running', 'pending']);
        }

        $activos = $query->with([
            'client:id,nombre',
            'region:id,codigo,nombre',
            'operatingSystem:id,nombre,logo',
            'instanceType:id,nombre,vcpus,memoria_gb',
        ])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nombre', 'like', "%{$search}%")
                        ->orWhere('hostname', 'like', "%{$search}%")
                        ->orWhereHas('client', function ($clientQuery) use ($search) {
                            $clientQuery->where('nombre', 'like', "%{$search}%");
                        });
                });
            })
            ->when($clientId, function ($query, $clientId) {
                $query->where('client_id', $clientId);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString()
            ->through(function ($server) {
                $server->tiempo_encendido_total = $server->tiempo_encendido_total;

                return $server;
            });

        $clients = Client::select('id', 'nombre')->orderBy('nombre')->get();

        $availableServers = Server::query()
            ->whereNull('client_id')
            ->whereNotIn('estado', ['terminated'])
            ->select('id', 'nombre', 'estado')
            ->orderBy('nombre')
            ->get();

        return Inertia::render('activos/index', [
            'activos' => $activos,
            'clients' => $clients,
            'availableServers' => $availableServers,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'client_id' => $clientId,
            ],
            'permissions' => [
                'canCreate' => auth()->user()->can('create.activos'),
                'canUpdate' => auth()->user()->can('update.activos'),
                'canDelete' => auth()->user()->can('delete.activos'),
                'canRun' => auth()->user()->can('run.servers'),
            ],
        ]);
    }

    public function store(StoreActivoRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $server = Server::findOrFail($validated['server_id']);

        if ($server->client_id !== null) {
            return back()->withErrors(['server_id' => 'Este servidor ya esta asignado a un cliente.']);
        }

        $ipAddress = sprintf('10.%d.%d.%d', rand(0, 255), rand(0, 255), rand(1, 254));

        $server->update([
            'client_id' => $validated['client_id'],
            'hostname' => $validated['hostname'],
            'ip_address' => $ipAddress,
            'entorno' => $validated['entorno'],
        ]);

        return back()->with('success', 'Activo creado correctamente.');
    }

    public function update(UpdateActivoRequest $request, Server $server): RedirectResponse
    {
        $validated = $request->validated();

        $server->update($validated);

        return back()->with('success', 'Activo actualizado correctamente.');
    }

    public function darDeBaja(Server $server): RedirectResponse
    {
        if ($server->estado === 'running' && $server->ultimo_inicio) {
            $seconds = (int) now()->diffInSeconds($server->ultimo_inicio);
            $server->tiempo_encendido_segundos += $seconds;
            $server->ultimo_inicio = null;
        }

        $server->estado = 'terminated';
        $server->save();
        $server->delete();

        return back()->with('success', 'Servidor dado de baja correctamente.');
    }
}
