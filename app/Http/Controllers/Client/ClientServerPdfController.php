<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Server;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Support\Str;
use Spatie\Activitylog\Models\Activity;
use Spatie\LaravelPdf\Facades\Pdf;

class ClientServerPdfController extends Controller
{
    public function download(Server $server): Responsable
    {
        $client = auth('client')->user();

        abort_unless($server->client_id === $client->id, 404);
        abort_unless($server->estado === 'running', 404);

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

        $filename = 'servidor-'.Str::slug($server->nombre).'-'.now()->format('Ymd').'.pdf';

        return Pdf::view('pdf.activo', [
            'server' => $server,
            'activities' => $activities,
            'costoMensualEstimado' => $costoMensualEstimado,
            'pagosPendientes' => $pagosPendientes,
        ])->download($filename);
    }
}
