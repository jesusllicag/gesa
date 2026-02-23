'use client';
import { Head, router, usePage } from '@inertiajs/react';
import {
    CheckIcon,
    CopyIcon,
    EditIcon,
    GlobeIcon,
    HardDriveIcon,
    LockIcon,
    MoreHorizontalIcon,
    PlayIcon,
    PlusIcon,
    PowerOffIcon,
    SearchIcon,
    ServerIcon,
    ShieldAlertIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
    destroy as destroyServer,
    start as startServer,
    stop as stopServer,
    store as storeServer,
    update as updateServer,
} from '@/actions/App/Http/Controllers/ServerController';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
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
import { CostPreview } from '@/components/cost-preview';
import AppLayout from '@/layouts/app-layout';
import { calcularCostoDiario } from '@/lib/server-costs';
import { index as indexServers } from '@/routes/servers';
import { BreadcrumbItem } from '@/types';


interface Creator {
    id: number;
    name: string;
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

interface Server {
    id: string;
    nombre: string;
    client_id: number | null;
    region_id: number;
    operating_system_id: number;
    image_id: number;
    instance_type_id: number;
    ram_gb: number;
    disco_gb: number;
    disco_tipo: 'SSD' | 'HDD';
    conexion: 'publica' | 'privada';
    estado: 'running' | 'stopped' | 'pending' | 'terminated' | 'pendiente_aprobacion';
    costo_diario: number;
    deleted_at: string | null;
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
    creator: Creator;
}

interface PaginatedServers {
    data: Server[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

interface Permissions {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canStop: boolean;
    canRun: boolean;
}

interface Client {
    id: number;
    nombre: string;
    email: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Servidores',
        href: indexServers().url,
    },
];

const statusFilters = [
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
    { value: 'all', label: 'Todos' },
];

const initialCreateForm = {
    nombre: '',
    client_id: '',
    region_id: '',
    operating_system_id: '',
    image_id: '',
    instance_type_id: '',
    ram_gb: 4,
    disco_gb: 50,
    disco_tipo: 'SSD' as 'SSD' | 'HDD',
    conexion: 'publica' as 'publica' | 'privada',
};

export default function Servers({
    servers,
    operatingSystems,
    instanceTypes,
    regions,
    clients,
    filters,
    permissions,
}: {
    servers: PaginatedServers;
    operatingSystems: OperatingSystem[];
    instanceTypes: InstanceType[];
    regions: Region[];
    clients: Client[];
    filters: { search: string; status: string };
    permissions: Permissions;
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'active');
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    // Create dialog
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ ...initialCreateForm });
    const [isCreating, setIsCreating] = useState(false);
    const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

    // Edit dialog
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingServer, setEditingServer] = useState<Server | null>(null);
    const [editForm, setEditForm] = useState({
        ram_gb: 0,
        disco_gb: 0,
        conexion: 'publica' as 'publica' | 'privada',
    });
    const [isUpdating, setIsUpdating] = useState(false);

    // Delete dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingServer, setDeletingServer] = useState<Server | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Stop dialog
    const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
    const [stoppingServer, setStoppingServer] = useState<Server | null>(null);
    const [isStopping, setIsStopping] = useState(false);

    // Secret key dialog
    const { flash } = usePage<{ flash?: { clave_privada?: string } }>().props;
    const [isSecretDialogOpen, setIsSecretDialogOpen] = useState(false);
    const [secretKey, setSecretKey] = useState('');
    const [secretCopied, setSecretCopied] = useState(false);

    useEffect(() => {
        if (flash?.clave_privada) {
            setSecretKey(flash.clave_privada);
            setSecretCopied(false);
            setIsSecretDialogOpen(true);
        }
    }, [flash?.clave_privada]);

    const copySecret = () => {
        navigator.clipboard.writeText(secretKey);
        setSecretCopied(true);
        setTimeout(() => setSecretCopied(false), 2000);
    };

    const isCreateFormDirty = useMemo(() => {
        return JSON.stringify(createForm) !== JSON.stringify(initialCreateForm);
    }, [createForm]);

    const handleCreateDialogClose = (open: boolean) => {
        if (!open && isCreateFormDirty) {
            setIsDiscardDialogOpen(true);
            return;
        }
        setIsCreateDialogOpen(open);
    };

    const handleDiscardChanges = () => {
        setIsDiscardDialogOpen(false);
        setIsCreateDialogOpen(false);
        setCreateForm({ ...initialCreateForm });
    };

    const createCostPreview = useMemo(() => {
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

    const editCostPreview = useMemo(() => {
        if (!editingServer) {
            return { costoInstancia: 0, costoRamExtra: 0, costoDisco: 0, surchargeConexion: 0, total: 0 };
        }
        const selectedInstanceType = instanceTypes.find(
            (t) => t.id === editingServer.instance_type_id,
        );
        return calcularCostoDiario(
            selectedInstanceType,
            editForm.ram_gb,
            editForm.disco_gb,
            editingServer.disco_tipo,
            editForm.conexion,
        );
    }, [editingServer, editForm.ram_gb, editForm.disco_gb, editForm.conexion, instanceTypes]);

    const handleSearch = (value: string) => {
        setSearch(value);

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            router.get(
                indexServers().url,
                { search: value, status: statusFilter },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        setSearchTimeout(timeout);
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        router.get(
            indexServers().url,
            { search, status: value },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const handleCreate = () => {
        setIsCreating(true);
        router.post(
            storeServer().url,
            {
                ...createForm,
                client_id: createForm.client_id ? Number(createForm.client_id) : null,
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
                onFinish: () => setIsCreating(false),
            }
        );
    };

    const openEditDialog = (server: Server) => {
        setEditingServer(server);
        setEditForm({
            ram_gb: server.ram_gb,
            disco_gb: server.disco_gb,
            conexion: server.conexion,
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = () => {
        if (!editingServer) return;

        setIsUpdating(true);
        router.put(
            updateServer(editingServer.id).url,
            editForm,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditDialogOpen(false);
                    setEditingServer(null);
                },
                onFinish: () => setIsUpdating(false),
            }
        );
    };

    const openDeleteDialog = (server: Server) => {
        setDeletingServer(server);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (!deletingServer) return;

        setIsDeleting(true);
        router.delete(destroyServer(deletingServer.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setDeletingServer(null);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const openStopDialog = (server: Server) => {
        setStoppingServer(server);
        setIsStopDialogOpen(true);
    };

    const handleStop = () => {
        if (!stoppingServer) return;

        setIsStopping(true);
        router.post(stopServer(stoppingServer.id).url, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsStopDialogOpen(false);
                setStoppingServer(null);
            },
            onFinish: () => setIsStopping(false),
        });
    };

    const handleStart = (server: Server) => {
        router.post(startServer(server.id).url, {}, {
            preserveScroll: true,
        });
    };

    const getPageUrl = (page: number) => {
        return indexServers({
            query: {
                page: page > 1 ? page : undefined,
                search: filters.search || undefined,
                status: filters.status !== 'active' ? filters.status : undefined,
            },
        }).url;
    };

    const generatePaginationPages = () => {
        const { current_page, last_page } = servers;
        const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];

        pages.push(1);

        if (last_page <= 5) {
            for (let i = 2; i <= last_page; i++) {
                pages.push(i);
            }
        } else {
            if (current_page > 3) {
                pages.push('ellipsis-start');
            }

            const start = Math.max(2, current_page - 1);
            const end = Math.min(last_page - 1, current_page + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }

            if (current_page < last_page - 2) {
                pages.push('ellipsis-end');
            }

            if (!pages.includes(last_page)) {
                pages.push(last_page);
            }
        }

        return pages;
    };

    const getStatusBadge = (server: Server) => {
        if (server.deleted_at) {
            return (
                <Badge variant="destructive">
                    Terminado
                </Badge>
            );
        }

        const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
            running: { label: 'Ejecutando', variant: 'default', className: 'bg-green-600' },
            stopped: { label: 'Detenido', variant: 'secondary', className: '' },
            pending: { label: 'Pendiente', variant: 'outline', className: 'border-yellow-500 text-yellow-600' },
            terminated: { label: 'Terminado', variant: 'destructive', className: '' },
            pendiente_aprobacion: { label: 'Pend. Aprobacion', variant: 'outline', className: 'border-amber-500 text-amber-600' },
        };
        const config = statusConfig[server.estado] ?? statusConfig.pending;
        return (
            <Badge variant={config.variant} className={config.className}>
                {config.label}
            </Badge>
        );
    };

    const canEditServer = (server: Server) => {
        return permissions.canUpdate && !server.deleted_at && server.estado !== 'terminated';
    };

    const canStopServer = (server: Server) => {
        return permissions.canStop && server.estado === 'running';
    };

    const canStartServer = (server: Server) => {
        return permissions.canRun && server.client_id !== null && (server.estado === 'stopped' || server.estado === 'pending');
    };

    const canDeleteServer = (server: Server) => {
        return permissions.canDelete && !server.deleted_at && server.estado !== 'terminated';
    };

    const selectedOs = operatingSystems.find(
        (os) => os.id === Number(createForm.operating_system_id)
    );
    const availableImages = selectedOs?.images || [];

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Servidores" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 items-center gap-4">
                        <div className="relative max-w-sm flex-1">
                            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                placeholder="Buscar servidores..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={handleStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusFilters.map((filter) => (
                                    <SelectItem key={filter.value} value={filter.value}>
                                        {filter.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {permissions.canCreate && (
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <PlusIcon className="mr-2 size-4" />
                            Nuevo Servidor
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID / Nombre</TableHead>
                                <TableHead>Sistema Operativo</TableHead>
                                <TableHead>Tipo Instancia</TableHead>
                                <TableHead>Region</TableHead>
                                <TableHead>Almacenamiento</TableHead>
                                <TableHead>Conexion</TableHead>
                                <TableHead>Costo/Dia</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {servers.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={9}
                                        className="text-muted-foreground py-8 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <ServerIcon className="size-12 opacity-50" />
                                            <p>No se encontraron servidores</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                servers.data.map((server) => (
                                    <TableRow key={server.id} className={server.deleted_at ? 'opacity-60' : ''}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {server.nombre}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-muted-foreground font-mono text-xs">
                                                        {server.id.slice(0, 8)}...
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-5"
                                                        onClick={() => copyToClipboard(server.id)}
                                                    >
                                                        <CopyIcon className="size-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex size-5 shrink-0 items-center justify-center">
                                                    <img
                                                        src={server.operating_system.logo}
                                                        alt={server.operating_system?.nombre}
                                                        className="max-h-5 max-w-5 object-contain dark:invert"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">
                                                        {server.image?.nombre}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs">
                                                        {server.image?.arquitectura}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-mono text-sm">
                                                    {server.instance_type?.nombre}
                                                </span>
                                                <span className="text-muted-foreground text-xs">
                                                    {server.instance_type?.vcpus} vCPUs /{' '}
                                                    {server.instance_type?.memoria_gb} GB
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {server.region?.codigo}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <HardDriveIcon className="text-muted-foreground size-4" />
                                                <span>
                                                    {server.disco_gb} GB {server.disco_tipo}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {server.conexion === 'publica' ? (
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <GlobeIcon className="size-4" />
                                                    <span>Publica</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-amber-600">
                                                    <LockIcon className="size-4" />
                                                    <span>Privada</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-sm font-medium text-green-700 dark:text-green-400">
                                                ${Number(server.costo_diario).toFixed(2)}
                                            </span>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(server)}</TableCell>
                                        <TableCell>
                                            {!server.deleted_at && server.estado !== 'terminated' && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                        >
                                                            <MoreHorizontalIcon className="size-4" />
                                                            <span className="sr-only">
                                                                Abrir menu
                                                            </span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {canStartServer(server) && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleStart(server)}
                                                            >
                                                                <PlayIcon className="mr-2 size-4" />
                                                                Iniciar
                                                            </DropdownMenuItem>
                                                        )}
                                                        {canStopServer(server) && (
                                                            <DropdownMenuItem
                                                                onClick={() => openStopDialog(server)}
                                                            >
                                                                <PowerOffIcon className="mr-2 size-4" />
                                                                Detener
                                                            </DropdownMenuItem>
                                                        )}
                                                        {canEditServer(server) && (
                                                            <DropdownMenuItem
                                                                onClick={() => openEditDialog(server)}
                                                            >
                                                                <EditIcon className="mr-2 size-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                        )}
                                                        {canDeleteServer(server) && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    variant="destructive"
                                                                    onClick={() => openDeleteDialog(server)}
                                                                >
                                                                    Terminar Instancia
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {servers.last_page > 1 && (
                    <div className="flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row">
                        <p className="text-muted-foreground text-sm">
                            Mostrando {servers.from} a {servers.to} de {servers.total} servidores
                        </p>
                        <Pagination className="mx-0 w-auto">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={getPageUrl(servers.current_page - 1)}
                                        disabled={servers.current_page === 1}
                                    />
                                </PaginationItem>

                                {generatePaginationPages().map((page, index) => (
                                    <PaginationItem key={index}>
                                        {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                                            <PaginationEllipsis />
                                        ) : (
                                            <PaginationLink
                                                href={getPageUrl(page)}
                                                isActive={page === servers.current_page}
                                            >
                                                {page}
                                            </PaginationLink>
                                        )}
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    <PaginationNext
                                        href={getPageUrl(servers.current_page + 1)}
                                        disabled={servers.current_page === servers.last_page}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}

                {/* Create Server Dialog */}
                <Dialog
                    open={isCreateDialogOpen}
                    onOpenChange={handleCreateDialogClose}
                >
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Lanzar Nueva Instancia</DialogTitle>
                            <DialogDescription>
                                Configura los parametros de tu nuevo servidor.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6">
                            {/* Basic Info */}
                            <div className="grid gap-2">
                                <Label htmlFor="create-nombre">Nombre del Servidor</Label>
                                <Input
                                    id="create-nombre"
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
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="create-client">Asignar a Cliente (opcional)</Label>
                                    <Select
                                        value={createForm.client_id}
                                        onValueChange={(value) =>
                                            setCreateForm((prev) => ({
                                                ...prev,
                                                client_id: value === '__none__' ? '' : value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger id="create-client">
                                            <SelectValue placeholder="Sin asignar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">Sin asignar</SelectItem>
                                            {clients.map((client) => (
                                                <SelectItem key={client.id} value={String(client.id)}>
                                                    {client.nombre}
                                                    <span className="text-muted-foreground ml-1 text-xs">({client.email})</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {createForm.client_id && (
                                        <p className="text-muted-foreground text-xs">
                                            El cliente recibira un email para aprobar el servidor.
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="create-region">Region</Label>
                                    <Select
                                        value={createForm.region_id}
                                        onValueChange={(value) =>
                                            setCreateForm((prev) => ({
                                                ...prev,
                                                region_id: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger id="create-region">
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
                                    <Label htmlFor="create-image">Imagen AMI</Label>
                                    <Select
                                        value={createForm.image_id}
                                        onValueChange={(value) =>
                                            setCreateForm((prev) => ({
                                                ...prev,
                                                image_id: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger id="create-image">
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
                                <Label htmlFor="create-instance-type">Tipo de Instancia</Label>
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
                                    <SelectTrigger id="create-instance-type">
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
                                    <Label htmlFor="create-ram">RAM (GB)</Label>
                                    <Input
                                        id="create-ram"
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
                                    <Label htmlFor="create-disco">Disco (GB)</Label>
                                    <Input
                                        id="create-disco"
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
                                    <Label htmlFor="create-disco-tipo">Tipo de Disco</Label>
                                    <Select
                                        value={createForm.disco_tipo}
                                        onValueChange={(value: 'SSD' | 'HDD') =>
                                            setCreateForm((prev) => ({
                                                ...prev,
                                                disco_tipo: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger id="create-disco-tipo">
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

                            {/* Cost Preview */}
                            <CostPreview desglose={createCostPreview} />
                        </div>
                        <DialogFooter className="mt-4">
                            <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button
                                onClick={handleCreate}
                                disabled={
                                    isCreating ||
                                    !createForm.nombre ||
                                    !createForm.region_id ||
                                    !createForm.operating_system_id ||
                                    !createForm.image_id ||
                                    !createForm.instance_type_id
                                }
                            >
                                {isCreating ? 'Lanzando...' : 'Lanzar Instancia'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Discard Changes Confirmation */}
                <AlertDialog
                    open={isDiscardDialogOpen}
                    onOpenChange={setIsDiscardDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tienes cambios sin guardar en el formulario. Si sales ahora, se perderan todos los cambios realizados.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDiscardChanges}
                                className="bg-destructive text-white hover:bg-destructive/90"
                            >
                                Descartar cambios
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Edit Server Dialog */}
                <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Modificar Servidor</DialogTitle>
                            <DialogDescription>
                                Modifica los recursos del servidor &quot;{editingServer?.nombre}&quot;.
                                Solo puedes ampliar RAM y disco, no reducirlos.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            {/* Server Info (read-only) */}
                            <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-muted-foreground text-sm">
                                    <span className="font-medium">Nombre:</span> {editingServer?.nombre}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    <span className="font-medium">Region:</span> {editingServer?.region?.nombre}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    <span className="font-medium">Sistema:</span> {editingServer?.operating_system?.nombre}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    <span className="font-medium">Instancia:</span> {editingServer?.instance_type?.nombre}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    <span className="font-medium">Tipo Disco:</span> {editingServer?.disco_tipo}
                                </p>
                            </div>

                            {/* Editable fields */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-ram">RAM (GB)</Label>
                                    <Input
                                        id="edit-ram"
                                        type="number"
                                        min={editingServer?.ram_gb || 1}
                                        max={256}
                                        value={editForm.ram_gb}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                ram_gb: Number(e.target.value),
                                            }))
                                        }
                                    />
                                    <p className="text-muted-foreground text-xs">
                                        Minimo: {editingServer?.ram_gb} GB (actual)
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-disco">Disco (GB)</Label>
                                    <Input
                                        id="edit-disco"
                                        type="number"
                                        min={editingServer?.disco_gb || 8}
                                        max={16000}
                                        value={editForm.disco_gb}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                disco_gb: Number(e.target.value),
                                            }))
                                        }
                                    />
                                    <p className="text-muted-foreground text-xs">
                                        Minimo: {editingServer?.disco_gb} GB (actual)
                                    </p>
                                </div>
                            </div>

                            {/* Connection type */}
                            <div className="grid gap-2">
                                <Label>Tipo de Conexion</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                conexion: 'publica',
                                            }))
                                        }
                                        className={`flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent ${
                                            editForm.conexion === 'publica'
                                                ? 'border-primary bg-accent'
                                                : ''
                                        }`}
                                    >
                                        <GlobeIcon className="size-4 text-green-600" />
                                        <span className="text-sm font-medium">Publica</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                conexion: 'privada',
                                            }))
                                        }
                                        className={`flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent ${
                                            editForm.conexion === 'privada'
                                                ? 'border-primary bg-accent'
                                                : ''
                                        }`}
                                    >
                                        <LockIcon className="size-4 text-amber-600" />
                                        <span className="text-sm font-medium">Privada</span>
                                    </button>
                                </div>
                            </div>

                            {/* Cost Preview for Edit */}
                            <CostPreview desglose={editCostPreview} />
                        </div>
                        <DialogFooter className="mt-4">
                            <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button
                                onClick={handleUpdate}
                                disabled={isUpdating}
                            >
                                {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Stop Server Dialog */}
                <AlertDialog
                    open={isStopDialogOpen}
                    onOpenChange={setIsStopDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Detener Servidor</AlertDialogTitle>
                            <AlertDialogDescription>
                                ¿Estas seguro de detener el servidor &quot;{stoppingServer?.nombre}&quot;?
                                El servidor dejara de estar disponible hasta que lo vuelvas a iniciar.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleStop}
                                disabled={isStopping}
                            >
                                {isStopping ? 'Deteniendo...' : 'Detener'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Delete Server Dialog */}
                <AlertDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Terminar Instancia</AlertDialogTitle>
                            <AlertDialogDescription>
                                ¿Estas seguro de terminar la instancia &quot;
                                {deletingServer?.nombre}&quot;? Esta accion eliminara
                                permanentemente el servidor y todos sus datos.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="bg-destructive text-white hover:bg-destructive/90"
                            >
                                {isDeleting ? 'Terminando...' : 'Terminar Instancia'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Secret Key Dialog */}
                <Dialog open={isSecretDialogOpen} onOpenChange={setIsSecretDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ShieldAlertIcon className="size-5 text-amber-500" />
                                Clave Privada Generada
                            </DialogTitle>
                            <DialogDescription>
                                Esta clave solo se mostrara una vez. Copiala y guardala en un lugar seguro antes de cerrar este dialogo.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="bg-muted flex items-center gap-2 rounded-lg border p-3">
                                <code className="flex-1 break-all text-sm font-medium">{secretKey}</code>
                                <Button variant="outline" size="icon" className="shrink-0" onClick={copySecret}>
                                    {secretCopied ? <CheckIcon className="size-4 text-green-600" /> : <CopyIcon className="size-4" />}
                                </Button>
                            </div>
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                                <p className="font-medium">Importante:</p>
                                <p>No podras volver a ver esta clave. Si la pierdes, deberas generar una nueva.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsSecretDialogOpen(false)}>Entendido</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
