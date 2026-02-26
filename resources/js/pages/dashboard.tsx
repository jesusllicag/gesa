import { Head, Link } from '@inertiajs/react';
import {
    ActivityIcon,
    AlertCircleIcon,
    CheckCircle2Icon,
    CircleDollarSignIcon,
    ClockIcon,
    CreditCardIcon,
    ServerIcon,
    TrendingUpIcon,
    UsersIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface Stats {
    total_servidores: number;
    servidores_activos: number;
    servidores_detenidos: number;
    servidores_pendientes: number;
    total_clientes: number;
    ingresos_este_mes: number;
    ingresos_totales: number;
    pagos_pendientes_total: number;
}

interface IngresoMensual {
    label: string;
    monto: number;
}

interface Actividad {
    id: number;
    description: string;
    log_name: string;
    causer_name: string;
    subject_name: string | null;
    created_at: string;
}

interface ClienteSummary {
    id: number;
    nombre: string;
    email: string;
    total_servidores: number;
    servidores_activos: number;
    pagos_pendientes: number;
    costo_mensual: number;
}

interface Props {
    stats: Stats;
    ingresosMensuales: IngresoMensual[];
    actividadesRecientes: Actividad[];
    clientes: ClienteSummary[];
}

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    colorClass,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    colorClass: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 pt-6">
                <div className={`rounded-xl p-3 ${colorClass}`}>
                    <Icon className="size-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

const CHART_HEIGHT_PX = 128;

function RevenueChart({ data }: { data: IngresoMensual[] }) {
    const max = Math.max(...data.map((d) => d.monto), 1);

    return (
        <div className="flex gap-2">
            {data.map((item, i) => {
                const barPx = Math.max((item.monto / max) * CHART_HEIGHT_PX, 3);
                return (
                    <div key={i} className="group relative flex flex-1 flex-col items-center gap-1">
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 rounded bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background opacity-0 transition-opacity group-hover:opacity-100">
                            ${item.monto.toFixed(2)}
                        </div>
                        {/* Bar area with fixed height so bars grow from bottom */}
                        <div className="flex w-full items-end" style={{ height: `${CHART_HEIGHT_PX}px` }}>
                            <div
                                className="w-full rounded-t-sm bg-blue-500 transition-all dark:bg-blue-400"
                                style={{ height: `${barPx}px` }}
                            />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{item.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

function logNameColor(logName: string): string {
    const map: Record<string, string> = {
        servidores: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        clientes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
        pagos: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
        solicitudes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    };
    return map[logName] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}

export default function Dashboard({ stats, ingresosMensuales, actividadesRecientes, clientes }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 p-4">
                {/* ── Stats row ── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Servidores Activos"
                        value={stats.servidores_activos}
                        subtitle={`${stats.total_servidores} en total`}
                        icon={ServerIcon}
                        colorClass="bg-green-500"
                    />
                    <StatCard
                        title="Servidores Detenidos"
                        value={stats.servidores_detenidos}
                        subtitle={`${stats.servidores_pendientes} pendientes`}
                        icon={AlertCircleIcon}
                        colorClass="bg-orange-500"
                    />
                    <StatCard
                        title="Ingresos Este Mes"
                        value={`$${stats.ingresos_este_mes.toFixed(2)}`}
                        subtitle={`$${stats.ingresos_totales.toFixed(2)} totales`}
                        icon={CircleDollarSignIcon}
                        colorClass="bg-blue-500"
                    />
                    <StatCard
                        title="Clientes"
                        value={stats.total_clientes}
                        subtitle={
                            stats.pagos_pendientes_total > 0
                                ? `${stats.pagos_pendientes_total} pagos pendientes`
                                : 'Sin pagos pendientes'
                        }
                        icon={UsersIcon}
                        colorClass="bg-purple-500"
                    />
                </div>

                {/* ── Revenue chart + Activity ── */}
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Revenue chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <TrendingUpIcon className="size-4 text-muted-foreground" />
                                Ingresos Ultimos 6 Meses
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RevenueChart data={ingresosMensuales} />
                        </CardContent>
                    </Card>

                    {/* Recent activity */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ActivityIcon className="size-4 text-muted-foreground" />
                                Actividad Reciente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ul className="divide-y overflow-y-auto" style={{ maxHeight: '21rem' }}>
                                {actividadesRecientes.length === 0 && (
                                    <li className="px-6 py-4 text-sm text-muted-foreground">Sin actividad reciente.</li>
                                )}
                                {actividadesRecientes.map((a) => (
                                    <li key={a.id} className="flex items-start gap-3 px-6 py-3">
                                        <div className="mt-0.5 shrink-0">
                                            <ClockIcon className="size-3.5 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span
                                                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${logNameColor(a.log_name)}`}
                                                >
                                                    {a.log_name}
                                                </span>
                                                <span className="text-sm">{a.description}</span>
                                                {a.subject_name && (
                                                    <span className="text-sm font-medium text-foreground">
                                                        — {a.subject_name}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {a.causer_name} &middot; {a.created_at}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Statistics row ── */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <CheckCircle2Icon className="size-8 text-green-500" />
                                <div>
                                    <p className="text-3xl font-bold">{stats.servidores_activos}</p>
                                    <p className="text-sm text-muted-foreground">Servidores corriendo</p>
                                </div>
                            </div>
                            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-green-500"
                                    style={{
                                        width:
                                            stats.total_servidores > 0
                                                ? `${(stats.servidores_activos / stats.total_servidores) * 100}%`
                                                : '0%',
                                    }}
                                />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {stats.total_servidores > 0
                                    ? `${Math.round((stats.servidores_activos / stats.total_servidores) * 100)}% del total`
                                    : 'Sin servidores'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <CreditCardIcon className="size-8 text-blue-500" />
                                <div>
                                    <p className="text-3xl font-bold">${stats.ingresos_este_mes.toFixed(2)}</p>
                                    <p className="text-sm text-muted-foreground">Ingresos este mes</p>
                                </div>
                            </div>
                            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                                {(() => {
                                    const prev = ingresosMensuales.at(-2)?.monto ?? 0;
                                    const curr = ingresosMensuales.at(-1)?.monto ?? 0;
                                    const pct = prev > 0 ? Math.min((curr / prev) * 100, 100) : curr > 0 ? 100 : 0;
                                    return <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />;
                                })()}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {(() => {
                                    const prev = ingresosMensuales.at(-2)?.monto ?? 0;
                                    const curr = ingresosMensuales.at(-1)?.monto ?? 0;
                                    if (prev === 0) {
                                        return curr > 0 ? 'Primer mes con ingresos' : 'Sin ingresos registrados';
                                    }
                                    const diff = ((curr - prev) / prev) * 100;
                                    return diff >= 0
                                        ? `+${diff.toFixed(1)}% vs mes anterior`
                                        : `${diff.toFixed(1)}% vs mes anterior`;
                                })()}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <AlertCircleIcon className="size-8 text-orange-500" />
                                <div>
                                    <p className="text-3xl font-bold">{stats.pagos_pendientes_total}</p>
                                    <p className="text-sm text-muted-foreground">Pagos pendientes</p>
                                </div>
                            </div>
                            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-orange-500"
                                    style={{
                                        width:
                                            stats.total_servidores > 0
                                                ? `${Math.min((stats.pagos_pendientes_total / stats.total_servidores) * 100, 100)}%`
                                                : '0%',
                                    }}
                                />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {stats.pagos_pendientes_total === 0
                                    ? 'Todos al dia'
                                    : `${stats.pagos_pendientes_total} pago(s) requieren atencion`}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Clients table ── */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UsersIcon className="size-4 text-muted-foreground" />
                            Resumen de Clientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead className="text-center">Servidores</TableHead>
                                    <TableHead className="text-center">Activos</TableHead>
                                    <TableHead className="text-center">Pag. Pendientes</TableHead>
                                    <TableHead className="text-right">Costo Mensual</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clientes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                            Sin clientes registrados.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {clientes.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell>
                                            <div className="font-medium">{c.nombre}</div>
                                            <div className="text-xs text-muted-foreground">{c.email}</div>
                                        </TableCell>
                                        <TableCell className="text-center">{c.total_servidores}</TableCell>
                                        <TableCell className="text-center">
                                            {c.servidores_activos > 0 ? (
                                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                                                    {c.servidores_activos}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">0</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {c.pagos_pendientes > 0 ? (
                                                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                                                    {c.pagos_pendientes}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-green-600 dark:text-green-400">Al dia</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            ${c.costo_mensual.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/admin/activos?client=${c.id}`}
                                                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                                            >
                                                Ver activos
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
