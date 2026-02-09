import { Head, router } from '@inertiajs/react';
import {
    CheckCircleIcon,
    ClockIcon,
    FileTextIcon,
    XCircleIcon,
} from 'lucide-react';
import { useState } from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

interface Solicitud {
    id: number;
    nombre: string;
    estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
    medio_pago: string;
    costo_diario_estimado: number;
    motivo_rechazo: string | null;
    ram_gb: number;
    disco_gb: number;
    disco_tipo: string;
    conexion: string;
    created_at: string;
    reviewed_at: string | null;
    client: {
        id: number;
        nombre: string;
        email: string;
    };
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
    image: {
        id: number;
        nombre: string;
        version: string;
        arquitectura: string;
    };
    instance_type: {
        id: number;
        nombre: string;
        vcpus: number;
        memoria_gb: number;
    };
    reviewer: {
        id: number;
        name: string;
    } | null;
}

interface PaginatedSolicitudes {
    data: Solicitud[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Solicitudes',
        href: '/admin/solicitudes',
    },
];

const estadoFilters = [
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'aprobada', label: 'Aprobadas' },
    { value: 'rechazada', label: 'Rechazadas' },
    { value: 'todas', label: 'Todas' },
];

const estadoConfig = {
    pendiente: { label: 'Pendiente', icon: ClockIcon, className: 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/50' },
    aprobada: { label: 'Aprobada', icon: CheckCircleIcon, className: 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/50' },
    rechazada: { label: 'Rechazada', icon: XCircleIcon, className: 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/50' },
    cancelada: { label: 'Cancelada', icon: XCircleIcon, className: 'border-gray-500 text-gray-600 bg-gray-50 dark:bg-gray-950/50' },
};

const medioPagoLabels: Record<string, string> = {
    transferencia_bancaria: 'Transferencia Bancaria',
    tarjeta_credito: 'Tarjeta de Credito',
    paypal: 'PayPal',
};

export default function SolicitudesIndex({
    solicitudes,
    filters,
}: {
    solicitudes: PaginatedSolicitudes;
    filters: { estado: string };
}) {
    const [estadoFilter, setEstadoFilter] = useState(filters.estado || 'pendiente');

    // Approve dialog
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [approvingSolicitud, setApprovingSolicitud] = useState<Solicitud | null>(null);
    const [isApproving, setIsApproving] = useState(false);

    // Reject dialog
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectingSolicitud, setRejectingSolicitud] = useState<Solicitud | null>(null);
    const [motivoRechazo, setMotivoRechazo] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const handleEstadoFilter = (value: string) => {
        setEstadoFilter(value);
        router.get(
            '/admin/solicitudes',
            { estado: value },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const openApproveDialog = (solicitud: Solicitud) => {
        setApprovingSolicitud(solicitud);
        setIsApproveDialogOpen(true);
    };

    const handleApprove = () => {
        if (!approvingSolicitud) return;

        setIsApproving(true);
        router.post(
            `/admin/solicitudes/${approvingSolicitud.id}/approve`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsApproveDialogOpen(false);
                    setApprovingSolicitud(null);
                },
                onFinish: () => setIsApproving(false),
            }
        );
    };

    const openRejectDialog = (solicitud: Solicitud) => {
        setRejectingSolicitud(solicitud);
        setMotivoRechazo('');
        setIsRejectDialogOpen(true);
    };

    const handleReject = () => {
        if (!rejectingSolicitud) return;

        setIsRejecting(true);
        router.post(
            `/admin/solicitudes/${rejectingSolicitud.id}/reject`,
            { motivo_rechazo: motivoRechazo },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsRejectDialogOpen(false);
                    setRejectingSolicitud(null);
                    setMotivoRechazo('');
                },
                onFinish: () => setIsRejecting(false),
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Solicitudes de Servidores" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 items-center gap-4">
                        <Select value={estadoFilter} onValueChange={handleEstadoFilter}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                {estadoFilters.map((filter) => (
                                    <SelectItem key={filter.value} value={filter.value}>
                                        {filter.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Servidor</TableHead>
                                <TableHead>Sistema Operativo</TableHead>
                                <TableHead>Tipo Instancia</TableHead>
                                <TableHead>Region</TableHead>
                                <TableHead>Medio de Pago</TableHead>
                                <TableHead>Costo Est./Dia</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="w-24">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {solicitudes.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-muted-foreground py-8 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileTextIcon className="size-12 opacity-50" />
                                            <p>No se encontraron solicitudes</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                solicitudes.data.map((solicitud) => {
                                    const config = estadoConfig[solicitud.estado];
                                    const EstadoIcon = config.icon;
                                    return (
                                        <TableRow key={solicitud.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{solicitud.client?.nombre}</span>
                                                    <span className="text-muted-foreground text-xs">{solicitud.client?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{solicitud.nombre}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex size-5 shrink-0 items-center justify-center">
                                                        <img
                                                            src={solicitud.operating_system?.logo}
                                                            alt={solicitud.operating_system?.nombre}
                                                            className="max-h-5 max-w-5 object-contain dark:invert"
                                                        />
                                                    </div>
                                                    <span className="text-sm">{solicitud.operating_system?.nombre}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-sm">{solicitud.instance_type?.nombre}</span>
                                                    <span className="text-muted-foreground text-xs">
                                                        {solicitud.instance_type?.vcpus} vCPUs / {solicitud.instance_type?.memoria_gb} GB
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{solicitud.region?.codigo}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{medioPagoLabels[solicitud.medio_pago] || solicitud.medio_pago}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-sm font-medium text-green-700 dark:text-green-400">
                                                    ${Number(solicitud.costo_diario_estimado).toFixed(2)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <EstadoIcon className="size-4" />
                                                    <Badge variant="outline" className={config.className}>
                                                        {config.label}
                                                    </Badge>
                                                </div>
                                                {solicitud.estado === 'rechazada' && solicitud.motivo_rechazo && (
                                                    <p className="mt-1 max-w-48 text-xs text-red-600 dark:text-red-400">
                                                        {solicitud.motivo_rechazo}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-muted-foreground text-sm">
                                                    {new Date(solicitud.created_at).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {solicitud.estado === 'pendiente' && (
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600 hover:bg-green-50 hover:text-green-700"
                                                            onClick={() => openApproveDialog(solicitud)}
                                                        >
                                                            <CheckCircleIcon className="mr-1 size-4" />
                                                            Aprobar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                            onClick={() => openRejectDialog(solicitud)}
                                                        >
                                                            <XCircleIcon className="mr-1 size-4" />
                                                            Rechazar
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination info */}
                {solicitudes.total > 0 && (
                    <div className="flex items-center justify-between border-t pt-4">
                        <p className="text-muted-foreground text-sm">
                            Mostrando {solicitudes.from} a {solicitudes.to} de {solicitudes.total} solicitudes
                        </p>
                    </div>
                )}

                {/* Approve Dialog */}
                <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Aprobar Solicitud</AlertDialogTitle>
                            <AlertDialogDescription>
                                ¿Estas seguro de aprobar la solicitud de servidor &quot;{approvingSolicitud?.nombre}&quot;
                                del cliente &quot;{approvingSolicitud?.client?.nombre}&quot;?
                                Se creara un nuevo servidor automaticamente.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleApprove}
                                disabled={isApproving}
                                className="bg-green-600 text-white hover:bg-green-700"
                            >
                                {isApproving ? 'Aprobando...' : 'Aprobar'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Reject Dialog */}
                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Rechazar Solicitud</DialogTitle>
                            <DialogDescription>
                                Indica el motivo por el cual se rechaza la solicitud de servidor &quot;{rejectingSolicitud?.nombre}&quot;
                                del cliente &quot;{rejectingSolicitud?.client?.nombre}&quot;.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="motivo-rechazo">Motivo de Rechazo</Label>
                                <Textarea
                                    id="motivo-rechazo"
                                    value={motivoRechazo}
                                    onChange={(e) => setMotivoRechazo(e.target.value)}
                                    placeholder="Ingresa el motivo del rechazo..."
                                    rows={4}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button
                                onClick={handleReject}
                                disabled={isRejecting || !motivoRechazo.trim()}
                                variant="destructive"
                            >
                                {isRejecting ? 'Rechazando...' : 'Rechazar Solicitud'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
