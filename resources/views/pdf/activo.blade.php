<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Activo - {{ $server->nombre }}</title>
    <style>
        @font-face {
            font-family: 'Arial';
            font-style: normal;
            font-weight: normal;
            src: url('{{ public_path('fonts/arial.ttf') }}');
        }
        @font-face {
            font-family: 'Arial';
            font-style: normal;
            font-weight: bold;
            src: url('{{ public_path('fonts/arialbd.ttf') }}');
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, DejaVu Sans, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }

        /* Page layout */
        .page { padding: 20mm 18mm; }

        /* Header */
        .header { border-bottom: 3px solid #1e40af; padding-bottom: 12px; margin-bottom: 18px; }
        .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .brand { font-size: 22px; font-weight: bold; color: #1e40af; letter-spacing: 1px; }
        .brand-sub { font-size: 10px; color: #6b7280; margin-top: 2px; }
        .doc-info { text-align: right; }
        .doc-title { font-size: 15px; font-weight: bold; color: #1e40af; }
        .doc-date { font-size: 10px; color: #6b7280; margin-top: 3px; }
        .doc-id { font-size: 9px; color: #9ca3af; margin-top: 2px; font-family: monospace; }

        /* Section */
        .section { margin-bottom: 18px; }
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #1e40af;
            background: #eff6ff;
            padding: 5px 8px;
            border-left: 4px solid #1e40af;
            margin-bottom: 10px;
        }

        /* Grid layout for dl */
        .info-grid { width: 100%; }
        .info-grid tr td { padding: 4px 6px; vertical-align: top; }
        .info-grid tr td:first-child { color: #6b7280; font-size: 10px; width: 38%; white-space: nowrap; }
        .info-grid tr td:nth-child(2) { font-weight: 600; }
        .info-grid tr:nth-child(even) td { background: #f9fafb; }

        /* Status badge */
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: bold;
        }
        .badge-running { background: #dcfce7; color: #15803d; }
        .badge-stopped { background: #f3f4f6; color: #374151; }
        .badge-pending { background: #fef9c3; color: #854d0e; }
        .badge-terminated { background: #fee2e2; color: #b91c1c; }
        .badge-pendiente_aprobacion { background: #fef3c7; color: #92400e; }

        /* Entorno badge */
        .badge-env { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .badge-dev { background: #dbeafe; color: #1d4ed8; }
        .badge-stg { background: #fef9c3; color: #854d0e; }
        .badge-qas { background: #f3e8ff; color: #7e22ce; }
        .badge-prod { background: #dcfce7; color: #15803d; }

        /* Billing table */
        .table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        .table th { background: #1e40af; color: #fff; font-size: 10px; padding: 5px 8px; text-align: left; }
        .table td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
        .table tbody tr:nth-child(even) td { background: #f9fafb; }
        .table .mono { font-family: monospace; }

        /* Pago estado */
        .pago-pendiente { color: #92400e; font-weight: bold; }
        .pago-pagado { color: #15803d; font-weight: bold; }
        .pago-vencido { color: #b91c1c; font-weight: bold; }

        /* Activity log */
        .activity-item { padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
        .activity-item:last-child { border-bottom: none; }
        .activity-desc { font-size: 11px; font-weight: 600; }
        .activity-meta { font-size: 9px; color: #9ca3af; margin-top: 2px; }

        /* Cost summary */
        .cost-box {
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 10px 14px;
            background: #eff6ff;
            margin-bottom: 16px;
        }
        .cost-box-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .cost-label { color: #4b5563; font-size: 10px; }
        .cost-value { font-weight: bold; color: #1e40af; font-family: monospace; }
        .cost-value-big { font-size: 14px; color: #1e3a8a; font-weight: bold; }

        /* Footer */
        .footer {
            position: fixed;
            bottom: 10mm;
            left: 18mm;
            right: 18mm;
            border-top: 1px solid #e5e7eb;
            padding-top: 6px;
            font-size: 9px;
            color: #9ca3af;
            display: flex;
            justify-content: space-between;
        }

        /* No-break for sections */
        .no-break { page-break-inside: avoid; }

        .text-right { text-align: right; }
        .empty-state { color: #9ca3af; font-style: italic; font-size: 10px; padding: 8px 0; }
    </style>
</head>
<body>
<div class="page">

    {{-- Header --}}
    <div class="header">
        <div class="header-top">
            <div>
                <div class="brand">GESA</div>
                <div class="brand-sub">Gestion de Servidores Administrados</div>
            </div>
            <div class="doc-info">
                <div class="doc-title">Resumen de Activo</div>
                <div class="doc-date">Generado: {{ now()->format('d/m/Y H:i') }}</div>
                <div class="doc-id">ID: {{ $server->id }}</div>
            </div>
        </div>
    </div>

    {{-- Cost summary box --}}
    <div class="cost-box no-break">
        <table style="width:100%;">
            <tr>
                <td style="width:33%; padding: 0 10px 0 0;">
                    <div class="cost-label">Costo Diario</div>
                    <div class="cost-value-big">${{ number_format((float)$server->costo_diario, 2) }}</div>
                </td>
                <td style="width:33%; padding: 0 10px; border-left: 1px solid #bfdbfe;">
                    <div class="cost-label">Costo Mensual Estimado</div>
                    <div class="cost-value-big">${{ number_format($costoMensualEstimado, 2) }}</div>
                </td>
                <td style="width:33%; padding: 0 0 0 10px; border-left: 1px solid #bfdbfe;">
                    <div class="cost-label">Estado de Pagos</div>
                    @if ($pagosPendientes === 0)
                        <div class="cost-value" style="color: #15803d;">Al dia</div>
                    @else
                        <div class="cost-value" style="color: #b91c1c;">{{ $pagosPendientes }} pendiente(s)</div>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    {{-- Server info --}}
    <div class="section no-break">
        <div class="section-title">Informacion del Servidor</div>
        <table class="info-grid">
            <tr>
                <td>Nombre</td>
                <td>{{ $server->nombre }}</td>
            </tr>
            <tr>
                <td>Hostname</td>
                <td>{{ $server->hostname ?? '-' }}</td>
            </tr>
            <tr>
                <td>IP</td>
                <td style="font-family: monospace;">{{ $server->ip_address ?? '-' }}</td>
            </tr>
            <tr>
                <td>Estado</td>
                <td>
                    @php
                        $estadoLabels = [
                            'running' => ['label' => 'Ejecutando', 'class' => 'badge-running'],
                            'stopped' => ['label' => 'Detenido', 'class' => 'badge-stopped'],
                            'pending' => ['label' => 'Pendiente', 'class' => 'badge-pending'],
                            'terminated' => ['label' => 'Terminado', 'class' => 'badge-terminated'],
                            'pendiente_aprobacion' => ['label' => 'Pend. Aprobacion', 'class' => 'badge-pendiente_aprobacion'],
                        ];
                        $estadoInfo = $estadoLabels[$server->estado] ?? ['label' => $server->estado, 'class' => 'badge-pending'];
                    @endphp
                    <span class="badge {{ $estadoInfo['class'] }}">{{ $estadoInfo['label'] }}</span>
                </td>
            </tr>
            <tr>
                <td>Entorno</td>
                <td>
                    @if ($server->entorno)
                        @php
                            $envClass = match($server->entorno) {
                                'DEV' => 'badge-dev',
                                'STG' => 'badge-stg',
                                'QAS' => 'badge-qas',
                                'PROD' => 'badge-prod',
                                default => 'badge-dev',
                            };
                        @endphp
                        <span class="badge-env {{ $envClass }}">{{ $server->entorno }}</span>
                    @else
                        -
                    @endif
                </td>
            </tr>
            <tr>
                <td>Region</td>
                <td>{{ $server->region ? $server->region->codigo . ' - ' . $server->region->nombre : '-' }}</td>
            </tr>
            <tr>
                <td>Sistema Operativo</td>
                <td>{{ $server->operatingSystem?->nombre ?? '-' }}</td>
            </tr>
            <tr>
                <td>Imagen</td>
                <td>
                    @if ($server->image)
                        {{ $server->image->nombre }} {{ $server->image->version }} ({{ $server->image->arquitectura }})
                    @else
                        -
                    @endif
                </td>
            </tr>
            <tr>
                <td>Tipo de Instancia</td>
                <td>
                    @if ($server->instanceType)
                        {{ $server->instanceType->nombre }} &mdash; {{ $server->instanceType->vcpus }} vCPUs, {{ $server->instanceType->memoria_gb }} GB RAM
                    @else
                        -
                    @endif
                </td>
            </tr>
            <tr>
                <td>RAM</td>
                <td>{{ $server->ram_gb }} GB</td>
            </tr>
            <tr>
                <td>Disco</td>
                <td>{{ $server->disco_gb }} GB ({{ $server->disco_tipo }})</td>
            </tr>
            <tr>
                <td>Conexion</td>
                <td>{{ ucfirst($server->conexion) }}</td>
            </tr>
            <tr>
                <td>Primera Activacion</td>
                <td>{{ $server->first_activated_at ? \Carbon\Carbon::parse($server->first_activated_at)->format('d/m/Y') : '-' }}</td>
            </tr>
            <tr>
                <td>Creado por</td>
                <td>{{ $server->creator?->name ?? '-' }}</td>
            </tr>
            <tr>
                <td>Fecha de Creacion</td>
                <td>{{ $server->created_at->format('d/m/Y H:i') }}</td>
            </tr>
        </table>
    </div>

    {{-- Client info --}}
    @if ($server->client)
    <div class="section no-break">
        <div class="section-title">Informacion del Cliente</div>
        <table class="info-grid">
            <tr>
                <td>Nombre</td>
                <td>{{ $server->client->nombre }}</td>
            </tr>
            <tr>
                <td>Email</td>
                <td>{{ $server->client->email }}</td>
            </tr>
            <tr>
                <td>Tipo Documento</td>
                <td>{{ strtoupper($server->client->tipo_documento) }}</td>
            </tr>
            <tr>
                <td>Numero Documento</td>
                <td style="font-family: monospace;">{{ $server->client->numero_documento }}</td>
            </tr>
        </table>
    </div>
    @endif

    {{-- Historial de Pagos --}}
    <div class="section no-break">
        <div class="section-title">Historial de Pagos</div>
        @if ($server->pagosMensuales->isEmpty())
            <p class="empty-state">Sin registros de pagos.</p>
        @else
            <table class="table">
                <thead>
                    <tr>
                        <th>Periodo</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Fecha de Pago</th>
                        <th>Observaciones</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($server->pagosMensuales as $pago)
                        @php
                            $meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                            $estadoClass = match($pago->estado) {
                                'pagado' => 'pago-pagado',
                                'pendiente' => 'pago-pendiente',
                                'vencido' => 'pago-vencido',
                                default => '',
                            };
                            $estadoLabel = match($pago->estado) {
                                'pagado' => 'Pagado',
                                'pendiente' => 'Pendiente',
                                'vencido' => 'Vencido',
                                default => $pago->estado,
                            };
                        @endphp
                        <tr>
                            <td class="mono">{{ $meses[$pago->mes] ?? $pago->mes }} {{ $pago->anio }}</td>
                            <td class="mono">${{ number_format((float)$pago->monto, 2) }}</td>
                            <td class="{{ $estadoClass }}">{{ $estadoLabel }}</td>
                            <td>{{ $pago->fecha_pago ? \Carbon\Carbon::parse($pago->fecha_pago)->format('d/m/Y') : '-' }}</td>
                            <td style="color: #6b7280;">{{ $pago->observaciones ?? '-' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif
    </div>

    {{-- Footer --}}
    <div class="footer">
        <span>GESA &mdash; {{ $server->nombre }}</span>
        <span>Generado el {{ now()->format('d/m/Y H:i') }}</span>
    </div>

</div>
</body>
</html>
