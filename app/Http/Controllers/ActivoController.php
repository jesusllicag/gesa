<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreActivoRequest;
use App\Http\Requests\UpdateActivoRequest;
use App\Models\Client;
use App\Models\PagoMensual;
use App\Models\Server;
use App\Notifications\ServidorPendienteAprobacionNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;
use Spatie\LaravelPdf\Facades\Pdf;

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
            $query->whereIn('estado', ['running', 'pending', 'pendiente_aprobacion']);
        }

        $activos = $query->with([
            'client:id,nombre',
            'region:id,codigo,nombre',
            'operatingSystem:id,nombre,logo',
            'instanceType:id,nombre,vcpus,memoria_gb',
            'pagosMensuales' => fn ($q) => $q->where('estado', 'pendiente')->latest()->limit(1),
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

        $pagoMesActual = $server->pagosMensuales
            ->where('anio', now()->year)
            ->where('mes', now()->month)
            ->sortByDesc('id')
            ->first();

        $currentActiveMs = $server->active_ms;
        if ($server->latest_release && $server->estado === 'running') {
            $currentActiveMs += (int) abs(now()->diffInMilliseconds($server->latest_release));
        }
        $currentActiveMs = max(0, $currentActiveMs);

        return Inertia::render('activos/show', [
            'server' => $server,
            'activities' => $activities,
            'costoMensualEstimado' => $costoMensualEstimado,
            'pagosPendientes' => $pagosPendientes,
            'currentActiveMs' => $currentActiveMs,
            'pagoMesActual' => $pagoMesActual,
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
        $tokenAprobacion = Str::random(64);

        $server->update([
            'client_id' => $validated['client_id'],
            'hostname' => $validated['hostname'],
            'ip_address' => $ipAddress,
            'entorno' => $validated['entorno'],
            'estado' => 'pendiente_aprobacion',
            'token_aprobacion' => $tokenAprobacion,
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

        $server->load(['region', 'operatingSystem', 'instanceType']);
        $client = Client::find($validated['client_id']);
        $client?->notify(new ServidorPendienteAprobacionNotification($server));

        return back()->with('success', 'Activo creado correctamente. Se ha notificado al cliente para que apruebe el servidor.');
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

    public function pdfActivo(Server $server): \Illuminate\Contracts\Support\Responsable
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
            ->limit(50)
            ->get();

        $diasDelMes = now()->daysInMonth;
        $costoMensualEstimado = round((float) $server->costo_diario * $diasDelMes, 2);
        $pagosPendientes = $server->pagosMensuales->whereIn('estado', ['pendiente', 'vencido'])->count();

        $filename = 'activo-'.Str::slug($server->nombre).'-'.now()->format('Ymd').'.pdf';

        return Pdf::view('pdf.activo', [
            'server' => $server,
            'activities' => $activities,
            'costoMensualEstimado' => $costoMensualEstimado,
            'pagosPendientes' => $pagosPendientes,
        ])->download($filename);
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

    public function validarPago(Server $server, PagoMensual $pago): RedirectResponse
    {
        abort_unless($pago->server_id === $server->id, 404);
        abort_unless($pago->estado === 'pendiente', 422);

        $diasCreditados = (float) $pago->monto / (float) $server->costo_diario;
        $msToCredit = (int) round($diasCreditados * 86_400_000);

        $pago->update([
            'estado' => 'pagado',
            'fecha_pago' => now(),
        ]);

        $server->increment('billed_active_ms', $msToCredit);

        activity('servidores')
            ->performedOn($server)
            ->causedBy(auth()->user())
            ->withProperties(['pago_id' => $pago->id, 'monto' => $pago->monto, 'dias_acreditados' => round($diasCreditados, 2)])
            ->log('Pago por transferencia validado por administrador');

        return back()->with('success', 'Pago validado correctamente. Se acreditaron '.round($diasCreditados, 1).' dias.');
    }
}
