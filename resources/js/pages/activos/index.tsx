'use client';
import { Head, Link, router } from '@inertiajs/react';
import {
    BoxIcon,
    CopyIcon,
    EditIcon,
    MoreHorizontalIcon,
    PlayIcon,
    PlusIcon,
    SearchIcon,
    Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';

import {
    darDeBaja,
    show as showActivo,
    store as storeActivo,
    update as updateActivo,
} from '@/actions/App/Http/Controllers/ActivoController';
import { start as startServer } from '@/actions/App/Http/Controllers/ServerController';
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
import AppLayout from '@/layouts/app-layout';
import { index as indexActivos } from '@/routes/activos';
import { BreadcrumbItem } from '@/types';


interface Client {
    id: number;
    nombre: string;
}

interface AvailableServer {
    id: string;
    nombre: string;
    estado: string;
}

interface Activo {
    id: string;
    nombre: string;
    hostname: string | null;
    ip_address: string | null;
    entorno: 'DEV' | 'STG' | 'QAS' | 'PROD' | null;
    estado: 'running' | 'stopped' | 'pending' | 'terminated' | 'pendiente_aprobacion';
    costo_diario: number;
    first_activated_at: string | null;
    deleted_at: string | null;
    client: {
        id: number;
        nombre: string;
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
    instance_type: {
        id: number;
        nombre: string;
        vcpus: number;
        memoria_gb: number;
    };
}

interface PaginatedActivos {
    data: Activo[];
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
    canRun: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Activos',
        href: indexActivos().url,
    },
];

const statusFilters = [
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
    { value: 'all', label: 'Todos' },
];

const entornoColors: Record<string, string> = {
    DEV: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    STG: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    QAS: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    PROD: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export default function Activos({
    activos,
    clients,
    availableServers,
    filters,
    permissions,
}: {
    activos: PaginatedActivos;
    clients: Client[];
    availableServers: AvailableServer[];
    filters: { search: string; status: string; client_id: string };
    permissions: Permissions;
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'active');
    const [clientFilter, setClientFilter] = useState(filters.client_id || '');
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    // Create dialog
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        client_id: '',
        server_id: '',
        hostname: '',
        entorno: '',
    });
    const [isCreating, setIsCreating] = useState(false);

    // Edit dialog
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingActivo, setEditingActivo] = useState<Activo | null>(null);
    const [editForm, setEditForm] = useState({
        hostname: '',
        entorno: '',
    });
    const [isUpdating, setIsUpdating] = useState(false);

    // Dar de baja dialog
    const [isDarDeBajaDialogOpen, setIsDarDeBajaDialogOpen] = useState(false);
    const [bajaActivo, setBajaActivo] = useState<Activo | null>(null);
    const [isDandoDeBaja, setIsDandoDeBaja] = useState(false);

    const handleSearch = (value: string) => {
        setSearch(value);

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            router.get(
                indexActivos().url,
                { search: value, status: statusFilter, client_id: clientFilter || undefined },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        setSearchTimeout(timeout);
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        router.get(
            indexActivos().url,
            { search, status: value, client_id: clientFilter || undefined },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleClientFilter = (value: string) => {
        const val = value === 'all' ? '' : value;
        setClientFilter(val);
        router.get(
            indexActivos().url,
            { search, status: statusFilter, client_id: val || undefined },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleCreate = () => {
        setIsCreating(true);
        router.post(
            storeActivo().url,
            {
                client_id: Number(createForm.client_id),
                server_id: createForm.server_id,
                hostname: createForm.hostname || null,
                entorno: createForm.entorno,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateDialogOpen(false);
                    setCreateForm({ client_id: '', server_id: '', hostname: '', entorno: '' });
                },
                onFinish: () => setIsCreating(false),
            },
        );
    };

    const openEditDialog = (activo: Activo) => {
        setEditingActivo(activo);
        setEditForm({
            hostname: activo.hostname || '',
            entorno: activo.entorno || '',
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = () => {
        if (!editingActivo) return;

        setIsUpdating(true);
        router.put(
            updateActivo(editingActivo.id).url,
            {
                hostname: editForm.hostname || null,
                entorno: editForm.entorno,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditDialogOpen(false);
                    setEditingActivo(null);
                },
                onFinish: () => setIsUpdating(false),
            },
        );
    };

    const openDarDeBajaDialog = (activo: Activo) => {
        setBajaActivo(activo);
        setIsDarDeBajaDialogOpen(true);
    };

    const handleDarDeBaja = () => {
        if (!bajaActivo) return;

        setIsDandoDeBaja(true);
        router.post(
            darDeBaja(bajaActivo.id).url,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDarDeBajaDialogOpen(false);
                    setBajaActivo(null);
                },
                onFinish: () => setIsDandoDeBaja(false),
            },
        );
    };

    const getPageUrl = (page: number) => {
        return indexActivos({
            query: {
                page: page > 1 ? page : undefined,
                search: filters.search || undefined,
                status: filters.status !== 'active' ? filters.status : undefined,
                client_id: filters.client_id || undefined,
            },
        }).url;
    };

    const generatePaginationPages = () => {
        const { current_page, last_page } = activos;
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

    const getStatusBadge = (activo: Activo) => {
        if (activo.deleted_at) {
            return <Badge variant="destructive">Terminado</Badge>;
        }

        const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
            running: { label: 'Ejecutando', variant: 'default', className: 'bg-green-600' },
            stopped: { label: 'Detenido', variant: 'secondary', className: '' },
            pending: { label: 'Pendiente', variant: 'outline', className: 'border-yellow-500 text-yellow-600' },
            terminated: { label: 'Terminado', variant: 'destructive', className: '' },
            pendiente_aprobacion: { label: 'Pend. Aprobacion', variant: 'outline', className: 'border-amber-500 text-amber-600' },
        };
        const config = statusConfig[activo.estado] ?? statusConfig.pending;
        return (
            <Badge variant={config.variant} className={config.className}>
                {config.label}
            </Badge>
        );
    };

    const canEditActivo = (activo: Activo) => {
        return permissions.canUpdate && !activo.deleted_at && activo.estado !== 'terminated';
    };

    const canStartActivo = (activo: Activo) => {
        return permissions.canRun && (activo.estado === 'stopped' || activo.estado === 'pending');
    };

    const handleStart = (activo: Activo) => {
        router.post(startServer(activo.id).url, {}, {
            preserveScroll: true,
        });
    };

    const canDarDeBaja = (activo: Activo) => {
        return permissions.canDelete && !activo.deleted_at && activo.estado !== 'terminated';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activos" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 items-center gap-4">
                        <div className="relative max-w-sm flex-1">
                            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                placeholder="Buscar activos..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={clientFilter || 'all'} onValueChange={handleClientFilter}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los clientes</SelectItem>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={String(client.id)}>
                                        {client.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                            Asignar Activo
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Servidor</TableHead>
                                <TableHead>Hostname</TableHead>
                                <TableHead>IP</TableHead>
                                <TableHead>Sistema Operativo</TableHead>
                                <TableHead>Entorno</TableHead>
                                <TableHead>Region</TableHead>
                                <TableHead>Fecha Alta</TableHead>
                                <TableHead>Costo/Dia</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activos.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-muted-foreground py-8 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <BoxIcon className="size-12 opacity-50" />
                                            <p>No se encontraron activos</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                activos.data.map((activo) => (
                                    <TableRow key={activo.id} className={activo.deleted_at ? 'opacity-60' : ''}>
                                        <TableCell>
                                            <span className="font-medium">{activo.client?.nombre}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={showActivo(activo.id).url}
                                                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                                            >
                                                {activo.nombre}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-sm">{activo.hostname || '-'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span className="font-mono text-sm">{activo.ip_address || '-'}</span>
                                                {activo.ip_address && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-6"
                                                        onClick={() => navigator.clipboard.writeText(activo.ip_address!)}
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
                                                        src={activo.operating_system?.logo}
                                                        alt={activo.operating_system?.nombre}
                                                        className="max-h-5 max-w-5 object-contain dark:invert"
                                                    />
                                                </div>
                                                <span className="text-sm">{activo.operating_system?.nombre}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {activo.entorno ? (
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${entornoColors[activo.entorno]}`}
                                                >
                                                    {activo.entorno}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{activo.region?.codigo}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">
                                                {activo.first_activated_at
                                                    ? new Date(activo.first_activated_at).toLocaleDateString('es-ES', {
                                                          day: '2-digit',
                                                          month: '2-digit',
                                                          year: 'numeric',
                                                      })
                                                    : '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-sm font-medium text-green-700 dark:text-green-400">
                                                ${Number(activo.costo_diario).toFixed(2)}
                                            </span>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(activo)}</TableCell>
                                        <TableCell>
                                            {!activo.deleted_at && activo.estado !== 'terminated' && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="size-8">
                                                            <MoreHorizontalIcon className="size-4" />
                                                            <span className="sr-only">Abrir menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {canStartActivo(activo) && (
                                                            <DropdownMenuItem onClick={() => handleStart(activo)}>
                                                                <PlayIcon className="mr-2 size-4" />
                                                                Iniciar
                                                            </DropdownMenuItem>
                                                        )}
                                                        {canEditActivo(activo) && (
                                                            <DropdownMenuItem onClick={() => openEditDialog(activo)}>
                                                                <EditIcon className="mr-2 size-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                        )}
                                                        {canDarDeBaja(activo) && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    variant="destructive"
                                                                    onClick={() => openDarDeBajaDialog(activo)}
                                                                >
                                                                    <Trash2Icon className="mr-2 size-4" />
                                                                    Dar de Baja
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
                {activos.last_page > 1 && (
                    <div className="flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row">
                        <p className="text-muted-foreground text-sm">
                            Mostrando {activos.from} a {activos.to} de {activos.total} activos
                        </p>
                        <Pagination className="mx-0 w-auto">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={getPageUrl(activos.current_page - 1)}
                                        disabled={activos.current_page === 1}
                                    />
                                </PaginationItem>

                                {generatePaginationPages().map((page, index) => (
                                    <PaginationItem key={index}>
                                        {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                                            <PaginationEllipsis />
                                        ) : (
                                            <PaginationLink href={getPageUrl(page)} isActive={page === activos.current_page}>
                                                {page}
                                            </PaginationLink>
                                        )}
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    <PaginationNext
                                        href={getPageUrl(activos.current_page + 1)}
                                        disabled={activos.current_page === activos.last_page}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}

                {/* Create Activo Dialog */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Asignar Activo</DialogTitle>
                            <DialogDescription>Asigna un servidor existente a un cliente.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="create-client">Cliente</Label>
                                <Select
                                    value={createForm.client_id}
                                    onValueChange={(value) => setCreateForm((prev) => ({ ...prev, client_id: value }))}
                                >
                                    <SelectTrigger id="create-client">
                                        <SelectValue placeholder="Seleccionar cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={String(client.id)}>
                                                {client.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-server">Servidor</Label>
                                <Select
                                    value={createForm.server_id}
                                    onValueChange={(value) => setCreateForm((prev) => ({ ...prev, server_id: value }))}
                                >
                                    <SelectTrigger id="create-server">
                                        <SelectValue placeholder="Seleccionar servidor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableServers.map((server) => (
                                            <SelectItem key={server.id} value={server.id}>
                                                {server.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-hostname">Hostname</Label>
                                <Input
                                    id="create-hostname"
                                    value={createForm.hostname}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, hostname: e.target.value }))}
                                    placeholder="web-server-01"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-entorno">Entorno</Label>
                                <Select
                                    value={createForm.entorno}
                                    onValueChange={(value) => setCreateForm((prev) => ({ ...prev, entorno: value }))}
                                >
                                    <SelectTrigger id="create-entorno">
                                        <SelectValue placeholder="Seleccionar entorno" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DEV">DEV - Desarrollo</SelectItem>
                                        <SelectItem value="STG">STG - Staging</SelectItem>
                                        <SelectItem value="QAS">QAS - Quality Assurance</SelectItem>
                                        <SelectItem value="PROD">PROD - Produccion</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button
                                onClick={handleCreate}
                                disabled={isCreating || !createForm.client_id || !createForm.server_id || !createForm.entorno}
                            >
                                {isCreating ? 'Asignando...' : 'Asignar Activo'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Activo Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Editar Activo</DialogTitle>
                            <DialogDescription>Modifica los datos del activo.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-muted-foreground text-sm">
                                    <span className="font-medium">Cliente:</span> {editingActivo?.client?.nombre}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    <span className="font-medium">Servidor:</span> {editingActivo?.nombre}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    <span className="font-medium">Estado:</span> {editingActivo?.estado}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-hostname">Hostname</Label>
                                <Input
                                    id="edit-hostname"
                                    value={editForm.hostname}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, hostname: e.target.value }))}
                                    placeholder="web-server-01"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-entorno">Entorno</Label>
                                <Select
                                    value={editForm.entorno}
                                    onValueChange={(value) => setEditForm((prev) => ({ ...prev, entorno: value }))}
                                >
                                    <SelectTrigger id="edit-entorno">
                                        <SelectValue placeholder="Seleccionar entorno" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DEV">DEV - Desarrollo</SelectItem>
                                        <SelectItem value="STG">STG - Staging</SelectItem>
                                        <SelectItem value="QAS">QAS - Quality Assurance</SelectItem>
                                        <SelectItem value="PROD">PROD - Produccion</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button onClick={handleUpdate} disabled={isUpdating || !editForm.entorno}>
                                {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dar de Baja Dialog */}
                <AlertDialog open={isDarDeBajaDialogOpen} onOpenChange={setIsDarDeBajaDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Dar de Baja Servidor</AlertDialogTitle>
                            <AlertDialogDescription>
                                ¿Estas seguro de dar de baja el servidor &quot;{bajaActivo?.nombre}&quot; del cliente &quot;
                                {bajaActivo?.client?.nombre}&quot;? Esta accion terminara la instancia y no se puede deshacer.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDarDeBaja}
                                disabled={isDandoDeBaja}
                                className="bg-destructive text-white hover:bg-destructive/90"
                            >
                                {isDandoDeBaja ? 'Procesando...' : 'Dar de Baja'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
