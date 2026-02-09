<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServerRequest;
use App\Http\Requests\UpdateServerRequest;
use App\Models\InstanceType;
use App\Models\OperatingSystem;
use App\Models\Region;
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
            'region:id,codigo,nombre',
            'operatingSystem:id,nombre,logo',
            'image:id,nombre,version,arquitectura',
            'instanceType:id,nombre,vcpus,memoria_gb',
            'creator:id,name',
        ])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nombre', 'like', "%{$search}%")
                        ->orWhere('id', 'like', "%{$search}%")
                        ->orWhereHas('region', function ($regionQuery) use ($search) {
                            $regionQuery->where('codigo', 'like', "%{$search}%")
                                ->orWhere('nombre', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $operatingSystems = OperatingSystem::select('id', 'nombre', 'logo')
            ->with('images:id,operating_system_id,nombre,version,arquitectura,ami_id')
            ->get();

        $instanceTypes = InstanceType::select('id', 'nombre', 'familia', 'vcpus', 'procesador', 'memoria_gb', 'rendimiento_red', 'precio_hora')
            ->orderBy('familia')
            ->orderBy('memoria_gb')
            ->get();

        $regions = Region::select('id', 'codigo', 'nombre')->get();

        return Inertia::render('servers/index', [
            'servers' => $servers,
            'operatingSystems' => $operatingSystems,
            'instanceTypes' => $instanceTypes,
            'regions' => $regions,
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

        $instanceType = InstanceType::findOrFail($validated['instance_type_id']);
        $costoDiario = $this->calcularCostoDiario(
            $instanceType,
            $validated['ram_gb'],
            $validated['disco_gb'],
            $validated['disco_tipo'],
            $validated['conexion']
        );

        $server = Server::create([
            ...$validated,
            'clave_privada' => $clavePrivada,
            'estado' => 'pending',
            'costo_diario' => $costoDiario,
            'created_by' => auth()->id(),
        ]);

        activity('servidores')
            ->performedOn($server)
            ->causedBy(auth()->user())
            ->log('Servidor creado');

        $redirect = back()->with('success', 'Servidor creado correctamente.');

        if ($clavePrivada) {
            $redirect->with('clave_privada', $clavePrivada);
        }

        return $redirect;
    }

    public function update(UpdateServerRequest $request, Server $server): RedirectResponse
    {
        $validated = $request->validated();

        $clavePrivada = null;

        // Si cambia de pública a privada, generar clave
        if ($validated['conexion'] === 'privada' && $server->conexion === 'publica') {
            $clavePrivada = Str::random(32);
            $validated['clave_privada'] = $clavePrivada;
        }

        // Si cambia de privada a pública, eliminar clave
        if ($validated['conexion'] === 'publica' && $server->conexion === 'privada') {
            $validated['clave_privada'] = null;
        }

        $instanceType = $server->instanceType;
        $validated['costo_diario'] = $this->calcularCostoDiario(
            $instanceType,
            $validated['ram_gb'],
            $validated['disco_gb'],
            $server->disco_tipo,
            $validated['conexion']
        );

        $cambios = array_diff_assoc($validated, $server->only(array_keys($validated)));

        $server->update($validated);

        activity('servidores')
            ->performedOn($server)
            ->causedBy(auth()->user())
            ->withProperties(['cambios' => $cambios])
            ->log('Servidor editado');

        $redirect = back()->with('success', 'Servidor actualizado correctamente.');

        if ($clavePrivada) {
            $redirect->with('clave_privada', $clavePrivada);
        }

        return $redirect;
    }

    public function start(Server $server): RedirectResponse
    {
        if ($server->client_id === null) {
            return back()->with('error', 'El servidor debe estar vinculado a un cliente para poder iniciarse.');
        }

        if (! in_array($server->estado, ['stopped', 'pending'])) {
            return back()->with('error', 'El servidor no puede ser iniciado en su estado actual.');
        }

        $data = [
            'estado' => 'running',
            'latest_release' => now(),
        ];

        if ($server->first_activated_at === null) {
            $data['first_activated_at'] = now();
        }

        $estadoAnterior = $server->estado;

        $server->update($data);

        activity('servidores')
            ->performedOn($server)
            ->causedBy(auth()->user())
            ->withProperties(['estado_anterior' => $estadoAnterior])
            ->log('Servidor iniciado');

        return back()->with('success', 'Servidor iniciado correctamente.');
    }

    public function stop(Server $server): RedirectResponse
    {
        if ($server->estado !== 'running') {
            return back()->with('error', 'El servidor no puede ser detenido en su estado actual.');
        }

        $elapsedMs = $server->latest_release
            ? (int) now()->diffInMilliseconds($server->latest_release)
            : 0;

        $totalMs = $server->active_ms + $elapsedMs;

        $server->update([
            'estado' => 'stopped',
            'active_ms' => $totalMs,
            'latest_release' => null,
        ]);

        activity('servidores')
            ->performedOn($server)
            ->causedBy(auth()->user())
            ->withProperties(['active_ms' => $totalMs])
            ->log('Servidor detenido');

        return back()->with('success', 'Servidor detenido correctamente.');
    }

    public function destroy(Server $server): RedirectResponse
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
            ->log('Servidor terminado');

        $server->delete();

        return back()->with('success', 'Servidor eliminado correctamente.');
    }

    private function calcularCostoDiario(
        InstanceType $instanceType,
        int $ramGb,
        int $discoGb,
        string $discoTipo,
        string $conexion
    ): float {
        $costoInstancia = $instanceType->precio_hora * 24;

        $ramExtraGb = max(0, $ramGb - (float) $instanceType->memoria_gb);
        $costoRamExtra = $ramExtraGb * 0.005 * 24;

        $tarifaDiscoDia = $discoTipo === 'SSD' ? (0.08 / 30) : (0.045 / 30);
        $costoDisco = $discoGb * $tarifaDiscoDia;

        $surchargeConexion = $conexion === 'privada' ? 1.20 : 0;

        return round($costoInstancia + $costoRamExtra + $costoDisco + $surchargeConexion, 4);
    }
}
