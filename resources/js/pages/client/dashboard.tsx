import { Head, router } from '@inertiajs/react';
import { CopyIcon, LogOutIcon, ServerIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Server {
    id: string;
    nombre: string;
    hostname: string | null;
    ip_address: string | null;
    entorno: 'DEV' | 'STG' | 'QAS' | 'PROD' | null;
    estado: 'running' | 'stopped' | 'pending' | 'terminated';
    costo_diario: number;
    region: {
        id: number;
        codigo: string;
        nombre: string;
    };
    operating_system: {
        id: number;
        nombre: string;
        logo: string;
    };
    instance_type: {
        id: number;
        nombre: string;
        vcpus: number;
        memoria_gb: number;
    };
}

interface DashboardProps {
    servers: Server[];
    clientAuth: {
        client: {
            id: number;
            nombre: string;
            email: string;
        };
    };
}

const entornoColors: Record<string, string> = {
    DEV: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    STG: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    QAS: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    PROD: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const statusConfig = {
    running: { label: 'Ejecutando', variant: 'default' as const, className: 'bg-green-600' },
    stopped: { label: 'Detenido', variant: 'secondary' as const, className: '' },
    pending: { label: 'Pendiente', variant: 'outline' as const, className: 'border-yellow-500 text-yellow-600' },
    terminated: { label: 'Terminado', variant: 'destructive' as const, className: '' },
};

export default function ClientDashboard({ servers, clientAuth }: DashboardProps) {
    const handleLogout = () => {
        router.post('/client/logout');
    };

    const getStatusBadge = (estado: Server['estado']) => {
        const config = statusConfig[estado];
        return (
            <Badge variant={config.variant} className={config.className}>
                {config.label}
            </Badge>
        );
    };

    return (
        <>
            <Head title="Dashboard - Portal de Clientes" />

            <div className="bg-background min-h-screen">
                <header className="border-b">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                        <div>
                            <h1 className="text-xl font-semibold">Portal de Clientes</h1>
                            <p className="text-muted-foreground text-sm">{clientAuth.client.nombre}</p>
                        </div>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOutIcon className="mr-2 size-4" />
                            Cerrar Sesion
                        </Button>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">Mis Servidores</h2>
                        <p className="text-muted-foreground text-sm">
                            Servidores asignados a tu cuenta
                        </p>
                    </div>

                    <div className="overflow-x-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Servidor</TableHead>
                                    <TableHead>Hostname</TableHead>
                                    <TableHead>IP</TableHead>
                                    <TableHead>Sistema Operativo</TableHead>
                                    <TableHead>Entorno</TableHead>
                                    <TableHead>Region</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Costo/Dia</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {servers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <ServerIcon className="size-12 opacity-50" />
                                                <p>No tienes servidores asignados</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    servers.map((server) => (
                                        <TableRow key={server.id}>
                                            <TableCell>
                                                <span className="font-medium">{server.nombre}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-sm">{server.hostname || '-'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono text-sm">{server.ip_address || '-'}</span>
                                                    {server.ip_address && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-6"
                                                            onClick={() => navigator.clipboard.writeText(server.ip_address!)}
                                                        >
                                                            <CopyIcon className="size-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex size-5 shrink-0 items-center justify-center">
                                                        <img
                                                            src={server.operating_system?.logo}
                                                            alt={server.operating_system?.nombre}
                                                            className="max-h-5 max-w-5 object-contain dark:invert"
                                                        />
                                                    </div>
                                                    <span className="text-sm">{server.operating_system?.nombre}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {server.entorno ? (
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${entornoColors[server.entorno]}`}
                                                    >
                                                        {server.entorno}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{server.region?.codigo}</Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(server.estado)}</TableCell>
                                            <TableCell>
                                                <span className="font-mono text-sm font-medium text-green-700 dark:text-green-400">
                                                    ${Number(server.costo_diario).toFixed(2)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </main>
            </div>
        </>
    );
}
