<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreActivoRequest;
use App\Http\Requests\UpdateActivoRequest;
use App\Models\Client;
use App\Models\Server;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

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
            ->withQueryString();

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

    public function show(Server $server): Response
    {
        $server->load([
            'client',
            'region',
            'operatingSystem',
            'image',
            'instanceType',
            'creator:id,name',
            'pagosMensuales' => fn ($q) => $q->orderByDesc('anio')->orderByDesc('mes'),
        ]);

        $activities = Activity::query()
            ->where('subject_type', Server::class)
            ->where('subject_id', $server->id)
            ->with('causer:id,name')
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        $diasDelMes = now()->daysInMonth;
        $costoMensualEstimado = round((float) $server->costo_diario * $diasDelMes, 4);

        $pagosPendientes = $server->pagosMensuales->whereIn('estado', ['pendiente', 'vencido'])->count();

        return Inertia::render('activos/show', [
            'server' => $server,
            'activities' => $activities,
            'costoMensualEstimado' => $costoMensualEstimado,
            'pagosPendientes' => $pagosPendientes,
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

        activity('servidores')
            ->performedOn($server)
            ->causedBy(auth()->user())
            ->withProperties([
                'client_id' => $validated['client_id'],
                'hostname' => $validated['hostname'],
                'entorno' => $validated['entorno'],
            ])
            ->log('Activo creado - Servidor asignado a cliente');

        return back()->with('success', 'Activo creado correctamente.');
    }

    public function update(UpdateActivoRequest $request, Server $server): RedirectResponse
    {
        $validated = $request->validated();

        $cambios = array_diff_assoc($validated, $server->only(array_keys($validated)));

        $server->update($validated);

        activity('servidores')
            ->performedOn($server)
            ->causedBy(auth()->user())
            ->withProperties(['cambios' => $cambios])
            ->log('Activo actualizado');

        return back()->with('success', 'Activo actualizado correctamente.');
    }

    public function darDeBaja(Server $server): RedirectResponse
    {
        if ($server->estado === 'running' && $server->latest_release) {
            $elapsedMs = (int) now()->diffInMilliseconds($server->latest_release);
            $server->active_ms += $elapsedMs;
            $server->latest_release = null;
        }

        $server->estado = 'terminated';
        $server->save();

        activity('servidores')
            ->performedOn($server)
            ->causedBy(auth()->user())
            ->withProperties([
                'client_id' => $server->client_id,
                'client_nombre' => $server->client?->nombre,
            ])
            ->log('Activo dado de baja');

        $server->delete();

        return back()->with('success', 'Servidor dado de baja correctamente.');
    }
}
