'use client';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    CalendarIcon,
    CopyIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ClockIcon,
    CreditCardIcon,
    DollarSignIcon,
    ServerIcon,
    UserIcon,
} from 'lucide-react';
import { useState } from 'react';

import { show as showActivo } from '@/actions/App/Http/Controllers/ActivoController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index as indexActivos } from '@/routes/activos';
import { BreadcrumbItem } from '@/types';


interface Client {
    id: number;
    nombre: string;
    email: string;
    tipo_documento: string;
    numero_documento: string;
}

interface Region {
    id: number;
    codigo: string;
    nombre: string;
}

interface OperatingSystem {
    id: number;
    nombre: string;
    logo: string;
}

interface Image {
    id: number;
    nombre: string;
    version: string;
    arquitectura: string;
}

interface InstanceType {
    id: number;
    nombre: string;
    vcpus: number;
    memoria_gb: number;
}

interface PagoMensual {
    id: number;
    anio: number;
    mes: number;
    monto: string;
    estado: 'pendiente' | 'pagado' | 'vencido';
    fecha_pago: string | null;
    observaciones: string | null;
}

interface ActivityProperties {
    [key: string]: unknown;
}

interface Activity {
    id: number;
    description: string;
    properties: ActivityProperties;
    created_at: string;
    causer: {
        id: number;
        name: string;
    } | null;
}

interface PaginatedActivities {
    data: Activity[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface ServerDetail {
    id: string;
    nombre: string;
    hostname: string | null;
    ip_address: string | null;
    entorno: 'DEV' | 'STG' | 'QAS' | 'PROD' | null;
    estado: 'running' | 'stopped' | 'pending' | 'terminated';
    costo_diario: string;
    ram_gb: number;
    disco_gb: number;
    disco_tipo: string;
    conexion: string;
    first_activated_at: string | null;
    tiempo_encendido_total: number;
    created_at: string;
    deleted_at: string | null;
    client: Client | null;
    region: Region | null;
    operating_system: OperatingSystem | null;
    image: Image | null;
    instance_type: InstanceType | null;
    creator: { id: number; name: string } | null;
    pagos_mensuales: PagoMensual[];
}

const entornoColors: Record<string, string> = {
    DEV: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    STG: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    QAS: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    PROD: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const mesesNombres = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatUptime(seconds: number): string {
    if (seconds <= 0) {
        return '0m';
    }

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if (days > 0) {
        parts.push(`${days}d`);
    }
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (minutes > 0 || parts.length === 0) {
        parts.push(`${minutes}m`);
    }

    return parts.join(' ');
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function ActivoShow({
    server,
    activities,
    costoMensualEstimado,
    pagosPendientes,
}: {
    server: ServerDetail;
    activities: PaginatedActivities;
    costoMensualEstimado: number;
    pagosPendientes: number;
}) {
    const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Activos', href: indexActivos().url },
        { title: server.nombre, href: showActivo(server.id).url },
    ];

    const toggleActivityExpanded = (activityId: number) => {
        setExpandedActivities((prev) => {
            const next = new Set(prev);
            if (next.has(activityId)) {
                next.delete(activityId);
            } else {
                next.add(activityId);
            }
            return next;
        });
    };

    const getEstadoPagoBadge = (estado: string) => {
        const config: Record<string, { label: string; className: string }> = {
            pendiente: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
            pagado: { label: 'Pagado', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
            vencido: { label: 'Vencido', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
        };
        const c = config[estado] || config.pendiente;
        return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${c.className}`}>{c.label}</span>;
    };

    const getStatusBadge = () => {
        if (server.deleted_at) {
            return <Badge variant="destructive">Terminado</Badge>;
        }
        const statusConfig = {
            running: { label: 'Ejecutando', variant: 'default' as const, className: 'bg-green-600' },
            stopped: { label: 'Detenido', variant: 'secondary' as const, className: '' },
            pending: { label: 'Pendiente', variant: 'outline' as const, className: 'border-yellow-500 text-yellow-600' },
            terminated: { label: 'Terminado', variant: 'destructive' as const, className: '' },
        };
        const config = statusConfig[server.estado];
        return (
            <Badge variant={config.variant} className={config.className}>
                {config.label}
            </Badge>
        );
    };

    const hasProperties = (activity: Activity) => {
        return activity.properties && Object.keys(activity.properties).length > 0;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Activo - ${server.nombre}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Back button */}
                <div>
                    <Link href={indexActivos().url} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors">
                        <ArrowLeftIcon className="size-4" />
                        Volver a Activos
                    </Link>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Costo Diario</CardTitle>
                            <DollarSignIcon className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                                ${Number(server.costo_diario).toFixed(2)}
                            </div>
                            <p className="text-muted-foreground text-xs">por dia</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Costo Mensual Estimado</CardTitle>
                            <CreditCardIcon className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                                ${costoMensualEstimado.toFixed(2)}
                            </div>
                            <p className="text-muted-foreground text-xs">este mes</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Estado de Pagos</CardTitle>
                            <CalendarIcon className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            {pagosPendientes === 0 ? (
                                <>
                                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">Al dia</div>
                                    <p className="text-muted-foreground text-xs">sin pagos pendientes</p>
                                </>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{pagosPendientes} pendientes</div>
                                    <p className="text-muted-foreground text-xs">pagos por realizar</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                            <ClockIcon className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatUptime(server.tiempo_encendido_total)}</div>
                            <p className="text-muted-foreground text-xs">tiempo encendido total</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main content: 2 columns */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left column */}
                    <div className="flex flex-col gap-6 lg:col-span-2">
                        {/* Server info card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <ServerIcon className="size-5" />
                                        Informacion del Servidor
                                    </CardTitle>
                                    {getStatusBadge()}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-muted-foreground text-sm">Nombre</dt>
                                        <dd className="font-medium">{server.nombre}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-sm">Hostname</dt>
                                        <dd className="font-mono">{server.hostname || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-sm">IP</dt>
                                        <dd className="font-mono">
                                            {server.ip_address || '-'} 
                                            { server.ip_address && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-6 ms-2"
                                                    onClick={() => copyToClipboard(server.ip_address!)}
                                                >
                                                    <CopyIcon className="size-3" />
                                                </Button>
                                            )}
                                        </dd>
                                        
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-sm">Sistema Operativo</dt>
                                        <dd className="flex items-center gap-2">
                                            {server.operating_system?.logo && (
                                                <img
                                                    src={server.operating_system.logo}
                                                    alt={server.operating_system.nombre}
                                                    className="size-6 object-contain dark:invert"
                                                />
                                            )}
                                            <span>{server.operating_system?.nombre || '-'}</span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-sm">Imagen</dt>
                                        <dd>
                                            {server.image
                                                ? `${server.image.nombre} ${server.image.version} (${server.image.arquitectura})`
                                                : '-'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-sm">Tipo de Instancia</dt>
                                        <dd>
                                            {server.instance_type
                                                ? `${server.instance_type.nombre} (${server.instance_type.vcpus} vCPUs, ${server.instance_type.memoria_gb} GB)`
                                                : '-'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-sm">Region</dt>
                                        <dd>
                                            {server.region ? (
                                                <Badge variant="outline">{server.region.codigo} - {server.region.nombre}</Badge>
                                            ) : '-'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-sm">RAM</dt>
                                        <dd>{server.ram_gb} GB</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-sm">Disco</dt>
                                        <dd>{server.disco_gb} GB ({server.disco_tipo})</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-sm">Conexion</dt>
                                        <dd className="capitalize">{server.conexion}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-sm">Entorno</dt>
                                        <dd>
                                            {server.entorno ? (
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${entornoColors[server.entorno]}`}>
                                                    {server.entorno}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-sm">Fecha de Alta</dt>
                                        <dd>{server.first_activated_at ? formatDate(server.first_activated_at) : '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-sm">Creado por</dt>
                                        <dd>{server.creator?.name || '-'}</dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>

                        {/* Client info card */}
                        {server.client && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserIcon className="size-5" />
                                        Informacion del Cliente
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <dt className="text-muted-foreground text-sm">Nombre</dt>
                                            <dd className="font-medium">{server.client.nombre}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground text-sm">Email</dt>
                                            <dd>{server.client.email}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground text-sm">Tipo Documento</dt>
                                            <dd className="uppercase">{server.client.tipo_documento}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground text-sm">Numero Documento</dt>
                                            <dd className="font-mono">{server.client.numero_documento}</dd>
                                        </div>
                                    </dl>
                                </CardContent>
                            </Card>
                        )}

                        {/* Billing card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCardIcon className="size-5" />
                                    Facturacion Mensual
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {server.pagos_mensuales.length === 0 ? (
                                    <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
                                        <CreditCardIcon className="size-12 opacity-50" />
                                        <p>No hay registros de facturacion</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Periodo</TableHead>
                                                    <TableHead>Monto</TableHead>
                                                    <TableHead>Estado</TableHead>
                                                    <TableHead>Fecha Pago</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {server.pagos_mensuales.map((pago) => (
                                                    <TableRow key={pago.id}>
                                                        <TableCell>
                                                            {mesesNombres[pago.mes]} {pago.anio}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-mono font-medium">
                                                                ${Number(pago.monto).toFixed(2)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>{getEstadoPagoBadge(pago.estado)}</TableCell>
                                                        <TableCell>
                                                            {pago.fecha_pago ? formatDate(pago.fecha_pago) : '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right column: Activity log */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ClockIcon className="size-5" />
                                    Historial de Actividad
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {activities.data.length === 0 ? (
                                    <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
                                        <ClockIcon className="size-12 opacity-50" />
                                        <p>Sin actividad registrada</p>
                                    </div>
                                ) : (
                                    <div className="space-y-0">
                                        {activities.data.map((activity, index) => (
                                            <div key={activity.id} className="relative flex gap-3 pb-6">
                                                {/* Timeline line */}
                                                {index < activities.data.length - 1 && (
                                                    <div className="bg-border absolute top-5 left-[7px] h-full w-px" />
                                                )}
                                                {/* Dot */}
                                                <div className="bg-primary mt-1.5 size-[15px] shrink-0 rounded-full border-2 border-white dark:border-gray-900" />
                                                {/* Content */}
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{activity.description}</p>
                                                    <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                                                        {activity.causer && (
                                                            <span>{activity.causer.name}</span>
                                                        )}
                                                        <span>{formatDateTime(activity.created_at)}</span>
                                                    </div>
                                                    {hasProperties(activity) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="mt-1 h-6 px-2 text-xs"
                                                            onClick={() => toggleActivityExpanded(activity.id)}
                                                        >
                                                            {expandedActivities.has(activity.id) ? (
                                                                <>
                                                                    <ChevronUpIcon className="mr-1 size-3" />
                                                                    Ocultar detalles
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDownIcon className="mr-1 size-3" />
                                                                    Ver detalles
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                    {expandedActivities.has(activity.id) && (
                                                        <pre className="bg-muted mt-2 overflow-x-auto rounded-md p-2 text-xs">
                                                            {JSON.stringify(activity.properties, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Pagination */}
                                {activities.last_page > 1 && (
                                    <div className="mt-4 border-t pt-4">
                                        <Pagination className="mx-0 w-auto">
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        href={showActivo(server.id, { query: { page: activities.current_page - 1 } }).url}
                                                        disabled={activities.current_page === 1}
                                                    />
                                                </PaginationItem>
                                                {Array.from({ length: activities.last_page }, (_, i) => i + 1).map((page) => (
                                                    <PaginationItem key={page}>
                                                        <PaginationLink
                                                            href={showActivo(server.id, { query: { page } }).url}
                                                            isActive={page === activities.current_page}
                                                        >
                                                            {page}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                ))}
                                                <PaginationItem>
                                                    <PaginationNext
                                                        href={showActivo(server.id, { query: { page: activities.current_page + 1 } }).url}
                                                        disabled={activities.current_page === activities.last_page}
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
