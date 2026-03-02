<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\PagoMensual;
use App\Models\Server;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class DashboardController extends Controller
{
    public function index(): Response
    {
        // ── Server stats ────────────────────────────────────────────
        $estadoCounts = Server::query()
            ->whereNull('deleted_at')
            ->selectRaw('estado, COUNT(*) as total')
            ->groupBy('estado')
            ->pluck('total', 'estado');

        $servidoresActivos = (int) ($estadoCounts['running'] ?? 0);
        $servidoresDetenidos = (int) ($estadoCounts['stopped'] ?? 0);
        $servidoresPendientes = (int) ($estadoCounts['pending'] ?? 0)
            + (int) ($estadoCounts['pendiente_aprobacion'] ?? 0);
        $totalServidores = (int) $estadoCounts->sum();

        // ── Revenue ─────────────────────────────────────────────────
        $ingresosEsteMes = (float) PagoMensual::query()
            ->where('estado', 'pagado')
            ->where('anio', now()->year)
            ->where('mes', now()->month)
            ->sum('monto');

        $ingresosTotales = (float) PagoMensual::query()
            ->where('estado', 'pagado')
            ->sum('monto');

        $pagosPendientesTotal = PagoMensual::query()
            ->where('estado', 'pendiente')
            ->count();

        /** Last 6 months breakdown for the revenue chart. */
        $ingresosMensuales = [];
        for ($i = 5; $i >= 0; $i--) {
            $fecha = now()->subMonths($i);
            $monto = (float) PagoMensual::query()
                ->where('estado', 'pagado')
                ->where('anio', $fecha->year)
                ->where('mes', $fecha->month)
                ->sum('monto');
            $ingresosMensuales[] = [
                'label' => $fecha->translatedFormat('M y'),
                'monto' => round($monto, 2),
            ];
        }

        // ── Recent activity ──────────────────────────────────────────
        $actividadesRecientes = Activity::query()
            ->with('causer')
            ->latest()
            ->limit(15)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'description' => $a->description,
                'log_name' => $a->log_name,
                'causer_name' => $a->causer?->name ?? $a->causer?->nombre ?? 'Sistema',
                'subject_name' => optional($a->subject)->nombre,
                'created_at' => $a->created_at->format('d/m/Y H:i'),
            ]);

        // ── Clients summary ──────────────────────────────────────────
        $costosPorCliente = Server::query()
            ->where('estado', 'running')
            ->whereNotNull('client_id')
            ->whereNull('deleted_at')
            ->selectRaw('client_id, SUM(CAST(costo_diario AS DECIMAL(10,4)) * 30) as costo_mensual')
            ->groupBy('client_id')
            ->pluck('costo_mensual', 'client_id');

        $totalesPorCliente = Server::query()
            ->whereNotNull('client_id')
            ->whereNull('deleted_at')
            ->selectRaw('client_id, COUNT(*) as total')
            ->groupBy('client_id')
            ->pluck('total', 'client_id');

        $activosPorCliente = Server::query()
            ->where('estado', 'running')
            ->whereNotNull('client_id')
            ->whereNull('deleted_at')
            ->selectRaw('client_id, COUNT(*) as total')
            ->groupBy('client_id')
            ->pluck('total', 'client_id');

        $pagosPendientesPorCliente = PagoMensual::query()
            ->where('pagos_mensuales.estado', 'pendiente')
            ->join('servers', 'pagos_mensuales.server_id', '=', 'servers.id')
            ->whereNull('servers.deleted_at')
            ->whereNotNull('servers.client_id')
            ->selectRaw('servers.client_id, COUNT(*) as total')
            ->groupBy('servers.client_id')
            ->pluck('total', 'servers.client_id');

        $clientes = Client::query()
            ->select('id', 'nombre', 'email', 'created_at')
            ->orderBy('nombre')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'nombre' => $c->nombre,
                'email' => $c->email,
                'total_servidores' => (int) ($totalesPorCliente[$c->id] ?? 0),
                'servidores_activos' => (int) ($activosPorCliente[$c->id] ?? 0),
                'pagos_pendientes' => (int) ($pagosPendientesPorCliente[$c->id] ?? 0),
                'costo_mensual' => round((float) ($costosPorCliente[$c->id] ?? 0), 2),
            ]);

        return Inertia::render('dashboard', [
            'stats' => [
                'total_servidores' => $totalServidores,
                'servidores_activos' => $servidoresActivos,
                'servidores_detenidos' => $servidoresDetenidos,
                'servidores_pendientes' => $servidoresPendientes,
                'total_clientes' => $clientes->count(),
                'ingresos_este_mes' => round($ingresosEsteMes, 2),
                'ingresos_totales' => round($ingresosTotales, 2),
                'pagos_pendientes_total' => $pagosPendientesTotal,
            ],
            'ingresosMensuales' => $ingresosMensuales,
            'actividadesRecientes' => $actividadesRecientes,
            'clientes' => $clientes,
        ]);
    }
}
