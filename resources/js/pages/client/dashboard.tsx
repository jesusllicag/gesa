import { Head, router } from '@inertiajs/react';
import {
    CheckCircleIcon,
    ClockIcon,
    CopyIcon,
    GlobeIcon,
    LockIcon,
    PlusIcon,
    ServerIcon,
    XCircleIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { ClientPortalHeader } from '@/components/client-portal-header';
import { CostPreview } from '@/components/cost-preview';
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
import { Input } from '@/components/ui/input';
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
import { calcularCostoDiario } from '@/lib/server-costs';

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

interface OperatingSystem {
    id: number;
    nombre: string;
    logo: string;
    images: Image[];
}

interface Image {
    id: number;
    operating_system_id: number;
    nombre: string;
    version: string;
    arquitectura: '32-bit' | '64-bit';
    ami_id: string;
}

interface InstanceType {
    id: number;
    nombre: string;
    familia: string;
    vcpus: number;
    procesador: string;
    memoria_gb: number;
    rendimiento_red: string;
    precio_hora: number;
}

interface Region {
    id: number;
    codigo: string;
    nombre: string;
}

interface Solicitud {
    id: number;
    nombre: string;
    estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
    medio_pago: string;
    costo_diario_estimado: number;
    motivo_rechazo: string | null;
    created_at: string;
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
    solicitudes: Solicitud[];
    operatingSystems: OperatingSystem[];
    instanceTypes: InstanceType[];
    regions: Region[];
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

const solicitudEstadoConfig = {
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

const initialCreateForm = {
    nombre: '',
    region_id: '',
    operating_system_id: '',
    image_id: '',
    instance_type_id: '',
    ram_gb: 4,
    disco_gb: 50,
    disco_tipo: 'SSD' as 'SSD' | 'HDD',
    conexion: 'publica' as 'publica' | 'privada',
    medio_pago: '' as string,
};

export default function ClientDashboard({ servers, solicitudes, operatingSystems, instanceTypes, regions }: DashboardProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ ...initialCreateForm });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getStatusBadge = (estado: Server['estado']) => {
        const config = statusConfig[estado];
        return (
            <Badge variant={config.variant} className={config.className}>
                {config.label}
            </Badge>
        );
    };

    const costPreview = useMemo(() => {
        const selectedInstanceType = instanceTypes.find(
            (t) => t.id === Number(createForm.instance_type_id),
        );
        return calcularCostoDiario(
            selectedInstanceType,
            createForm.ram_gb,
            createForm.disco_gb,
            createForm.disco_tipo,
            createForm.conexion,
        );
    }, [createForm.instance_type_id, createForm.ram_gb, createForm.disco_gb, createForm.disco_tipo, createForm.conexion, instanceTypes]);

    const handleSubmitSolicitud = () => {
        setIsSubmitting(true);
        router.post(
            '/client/solicitudes',
            {
                ...createForm,
                region_id: Number(createForm.region_id),
                operating_system_id: Number(createForm.operating_system_id),
                image_id: Number(createForm.image_id),
                instance_type_id: Number(createForm.instance_type_id),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateDialogOpen(false);
                    setCreateForm({ ...initialCreateForm });
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const selectedOs = operatingSystems.find(
        (os) => os.id === Number(createForm.operating_system_id)
    );
    const availableImages = selectedOs?.images || [];

    return (
        <>
            <Head title="Dashboard - Portal de Clientes" />

            <div className="bg-background min-h-screen">
                <ClientPortalHeader>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <PlusIcon className="mr-2 size-4" />
                        Solicitar Servidor
                    </Button>
                </ClientPortalHeader>

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Servidores asignados */}
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

                    {/* Mis Solicitudes */}
                    <div className="mt-10 mb-6">
                        <h2 className="text-lg font-semibold">Mis Solicitudes</h2>
                        <p className="text-muted-foreground text-sm">
                            Solicitudes de servidores enviadas
                        </p>
                    </div>

                    <div className="overflow-x-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Servidor</TableHead>
                                    <TableHead>Sistema Operativo</TableHead>
                                    <TableHead>Tipo Instancia</TableHead>
                                    <TableHead>Region</TableHead>
                                    <TableHead>Medio de Pago</TableHead>
                                    <TableHead>Costo Est./Dia</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Fecha</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {solicitudes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <ClockIcon className="size-12 opacity-50" />
                                                <p>No has enviado solicitudes</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    solicitudes.map((solicitud) => {
                                        const estadoConfig = solicitudEstadoConfig[solicitud.estado];
                                        const EstadoIcon = estadoConfig.icon;
                                        return (
                                            <TableRow key={solicitud.id}>
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
                                                    <span className="font-mono text-sm">{solicitud.instance_type?.nombre}</span>
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
                                                        <Badge variant="outline" className={estadoConfig.className}>
                                                            {estadoConfig.label}
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
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </main>
            </div>

            {/* Solicitar Servidor Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Solicitar Nuevo Servidor</DialogTitle>
                        <DialogDescription>
                            Configura los parametros del servidor que deseas solicitar. Un administrador revisara tu solicitud.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6">
                        {/* Basic Info */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="solicitud-nombre">Nombre del Servidor</Label>
                                <Input
                                    id="solicitud-nombre"
                                    value={createForm.nombre}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            nombre: e.target.value,
                                        }))
                                    }
                                    placeholder="mi-servidor-web"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="solicitud-region">Region</Label>
                                <Select
                                    value={createForm.region_id}
                                    onValueChange={(value) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            region_id: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger id="solicitud-region">
                                        <SelectValue placeholder="Seleccionar region" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {regions.map((region) => (
                                            <SelectItem key={region.id} value={String(region.id)}>
                                                {region.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Operating System */}
                        <div className="grid gap-2">
                            <Label>Sistema Operativo</Label>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                                {operatingSystems.map((os) => (
                                    <button
                                        key={os.id}
                                        type="button"
                                        onClick={() =>
                                            setCreateForm((prev) => ({
                                                ...prev,
                                                operating_system_id: String(os.id),
                                                image_id: '',
                                            }))
                                        }
                                        className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-1 transition-colors hover:bg-accent ${
                                            createForm.operating_system_id === String(os.id)
                                                ? 'border-primary bg-accent'
                                                : ''
                                        }`}
                                    >
                                        <div className="flex size-14 items-center justify-center">
                                            <img
                                                src={os.logo}
                                                alt={os.nombre}
                                                className="max-h-14 max-w-14 object-contain dark:invert"
                                            />
                                        </div>
                                        <span className="text-center text-xs">
                                            {os.nombre}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Image Selection */}
                        {selectedOs && (
                            <div className="grid gap-2">
                                <Label htmlFor="solicitud-image">Imagen AMI</Label>
                                <Select
                                    value={createForm.image_id}
                                    onValueChange={(value) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            image_id: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger id="solicitud-image">
                                        <SelectValue placeholder="Seleccionar imagen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableImages.map((image) => (
                                            <SelectItem key={image.id} value={String(image.id)}>
                                                <div className="flex flex-col">
                                                    <span>{image.nombre}</span>
                                                    <span className="text-muted-foreground text-xs">
                                                        {image.ami_id} - {image.arquitectura}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Instance Type */}
                        <div className="grid gap-2">
                            <Label htmlFor="solicitud-instance-type">Tipo de Instancia</Label>
                            <Select
                                value={createForm.instance_type_id}
                                onValueChange={(value) => {
                                    const selectedType = instanceTypes.find((t) => t.id === Number(value));
                                    setCreateForm((prev) => ({
                                        ...prev,
                                        instance_type_id: value,
                                        ram_gb: selectedType ? Number(selectedType.memoria_gb) : prev.ram_gb,
                                    }));
                                }}
                            >
                                <SelectTrigger id="solicitud-instance-type">
                                    <SelectValue placeholder="Seleccionar tipo de instancia" />
                                </SelectTrigger>
                                <SelectContent>
                                    {instanceTypes.map((type) => (
                                        <SelectItem key={type.id} value={String(type.id)}>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono">{type.nombre}</span>
                                                <span className="text-muted-foreground text-xs">
                                                    ({type.vcpus} vCPUs, {type.memoria_gb} GB RAM, ${Number(type.precio_hora).toFixed(4)}/hr) - {type.familia}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Storage */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="solicitud-ram">RAM (GB)</Label>
                                <Input
                                    id="solicitud-ram"
                                    type="number"
                                    min={1}
                                    max={256}
                                    value={createForm.ram_gb}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            ram_gb: Number(e.target.value),
                                        }))
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="solicitud-disco">Disco (GB)</Label>
                                <Input
                                    id="solicitud-disco"
                                    type="number"
                                    min={8}
                                    max={16000}
                                    value={createForm.disco_gb}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            disco_gb: Number(e.target.value),
                                        }))
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="solicitud-disco-tipo">Tipo de Disco</Label>
                                <Select
                                    value={createForm.disco_tipo}
                                    onValueChange={(value: 'SSD' | 'HDD') =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            disco_tipo: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger id="solicitud-disco-tipo">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SSD">SSD (Recomendado)</SelectItem>
                                        <SelectItem value="HDD">HDD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Network */}
                        <div className="grid gap-2">
                            <Label>Tipo de Conexion</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            conexion: 'publica',
                                        }))
                                    }
                                    className={`flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent ${
                                        createForm.conexion === 'publica'
                                            ? 'border-primary bg-accent'
                                            : ''
                                    }`}
                                >
                                    <GlobeIcon className="size-5 text-green-600" />
                                    <div className="text-left">
                                        <p className="font-medium">Publica</p>
                                        <p className="text-muted-foreground text-xs">
                                            Accesible desde Internet
                                        </p>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            conexion: 'privada',
                                        }))
                                    }
                                    className={`flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent ${
                                        createForm.conexion === 'privada'
                                            ? 'border-primary bg-accent'
                                            : ''
                                    }`}
                                >
                                    <LockIcon className="size-5 text-amber-600" />
                                    <div className="text-left">
                                        <p className="font-medium">Privada</p>
                                        <p className="text-muted-foreground text-xs">
                                            Requiere clave de acceso
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="grid gap-2">
                            <Label htmlFor="solicitud-medio-pago">Medio de Pago</Label>
                            <Select
                                value={createForm.medio_pago}
                                onValueChange={(value) =>
                                    setCreateForm((prev) => ({
                                        ...prev,
                                        medio_pago: value,
                                    }))
                                }
                            >
                                <SelectTrigger id="solicitud-medio-pago">
                                    <SelectValue placeholder="Seleccionar medio de pago" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="transferencia_bancaria">Transferencia Bancaria</SelectItem>
                                    <SelectItem value="tarjeta_credito">Tarjeta de Credito</SelectItem>
                                    <SelectItem value="paypal">PayPal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Cost Preview */}
                        <CostPreview desglose={costPreview} />
                    </div>
                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button
                            onClick={handleSubmitSolicitud}
                            disabled={
                                isSubmitting ||
                                !createForm.nombre ||
                                !createForm.region_id ||
                                !createForm.operating_system_id ||
                                !createForm.image_id ||
                                !createForm.instance_type_id ||
                                !createForm.medio_pago
                            }
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
