<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServerRequest;
use App\Http\Requests\UpdateServerRequest;
use App\Models\InstanceType;
use App\Models\OperatingSystem;
use App\Models\Server;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ServerController extends Controller
{
    public function index(): Response
    {
        $search = request()->input('search', '');
        $status = request()->input('status', 'active');

        $query = Server::query();

        // Filtro de estado
        if ($status === 'all') {
            $query->withTrashed();
        } elseif ($status === 'inactive') {
            $query->withTrashed()->where(function ($q) {
                $q->whereIn('estado', ['stopped', 'terminated'])
                    ->orWhereNotNull('deleted_at');
            });
        } else {
            // Por defecto: solo activos (running, pending)
            $query->whereIn('estado', ['running', 'pending']);
        }

        $servers = $query->with([
            'operatingSystem:id,nombre,logo',
            'image:id,nombre,version,arquitectura',
            'instanceType:id,nombre,vcpus,memoria_gb',
            'creator:id,name',
        ])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nombre', 'like', "%{$search}%")
                        ->orWhere('id', 'like', "%{$search}%")
                        ->orWhere('region', 'like', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $operatingSystems = OperatingSystem::select('id', 'nombre', 'logo')
            ->with('images:id,operating_system_id,nombre,version,arquitectura,ami_id')
            ->get();

        $instanceTypes = InstanceType::select('id', 'nombre', 'familia', 'vcpus', 'procesador', 'memoria_gb', 'rendimiento_red')
            ->orderBy('familia')
            ->orderBy('memoria_gb')
            ->get();

        return Inertia::render('servers/index', [
            'servers' => $servers,
            'operatingSystems' => $operatingSystems,
            'instanceTypes' => $instanceTypes,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'permissions' => [
                'canCreate' => auth()->user()->can('create.servers'),
                'canUpdate' => auth()->user()->can('update.servers'),
                'canDelete' => auth()->user()->can('delete.servers'),
                'canStop' => auth()->user()->can('stop.servers'),
                'canRun' => auth()->user()->can('run.servers'),
            ],
        ]);
    }

    public function store(StoreServerRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $clavePrivada = null;
        if ($validated['conexion'] === 'privada') {
            $clavePrivada = Str::random(32);
        }

        Server::create([
            ...$validated,
            'clave_privada' => $clavePrivada,
            'estado' => 'pending',
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', 'Servidor creado correctamente.');
    }

    public function update(UpdateServerRequest $request, Server $server): RedirectResponse
    {
        $validated = $request->validated();

        // Si cambia de pública a privada, generar clave
        if ($validated['conexion'] === 'privada' && $server->conexion === 'publica') {
            $validated['clave_privada'] = Str::random(32);
        }

        // Si cambia de privada a pública, eliminar clave
        if ($validated['conexion'] === 'publica' && $server->conexion === 'privada') {
            $validated['clave_privada'] = null;
        }

        $server->update($validated);

        return back()->with('success', 'Servidor actualizado correctamente.');
    }

    public function start(Server $server): RedirectResponse
    {
        if (! in_array($server->estado, ['stopped', 'pending'])) {
            return back()->with('error', 'El servidor no puede ser iniciado en su estado actual.');
        }

        $server->update(['estado' => 'running']);

        return back()->with('success', 'Servidor iniciado correctamente.');
    }

    public function stop(Server $server): RedirectResponse
    {
        if ($server->estado !== 'running') {
            return back()->with('error', 'El servidor no puede ser detenido en su estado actual.');
        }

        $server->update(['estado' => 'stopped']);

        return back()->with('success', 'Servidor detenido correctamente.');
    }

    public function destroy(Server $server): RedirectResponse
    {
        $server->update(['estado' => 'terminated']);
        $server->delete();

        return back()->with('success', 'Servidor eliminado correctamente.');
    }
}
