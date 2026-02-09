'use client';
import { Head, router } from '@inertiajs/react';
import { MoreHorizontalIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';

import {
    destroy as destroyClient,
    store as storeClient,
    update as updateClient,
} from '@/actions/App/Http/Controllers/ClientController';
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
import { index as indexClients } from '@/routes/clients';
import { BreadcrumbItem } from '@/types';


interface Creator {
    id: number;
    name: string;
}

interface Client {
    id: number;
    nombre: string;
    email: string;
    tipo_documento: 'DNI' | 'RUC';
    numero_documento: string;
    created_by: number;
    created_at: string;
    creator: Creator;
}

interface PaginatedClients {
    data: Client[];
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
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Clientes',
        href: indexClients().url,
    },
];

export default function Clients({
    clients,
    filters,
    permissions,
}: {
    clients: PaginatedClients;
    filters: { search: string };
    permissions: Permissions;
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    // Create dialog
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        nombre: '',
        email: '',
        tipo_documento: 'DNI' as 'DNI' | 'RUC',
        numero_documento: '',
    });
    const [isCreating, setIsCreating] = useState(false);

    // Edit dialog
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [editForm, setEditForm] = useState({
        nombre: '',
        email: '',
        tipo_documento: 'DNI' as 'DNI' | 'RUC',
        numero_documento: '',
    });
    const [isUpdating, setIsUpdating] = useState(false);

    // Delete dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingClient, setDeletingClient] = useState<Client | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (value: string) => {
        setSearch(value);

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            router.get(
                indexClients().url,
                { search: value },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        setSearchTimeout(timeout);
    };

    const handleCreate = () => {
        setIsCreating(true);
        router.post(storeClient().url, createForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateDialogOpen(false);
                setCreateForm({
                    nombre: '',
                    email: '',
                    tipo_documento: 'DNI',
                    numero_documento: '',
                });
            },
            onFinish: () => setIsCreating(false),
        });
    };

    const openEditDialog = (client: Client) => {
        setEditingClient(client);
        setEditForm({
            nombre: client.nombre,
            email: client.email,
            tipo_documento: client.tipo_documento,
            numero_documento: client.numero_documento,
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = () => {
        if (!editingClient) return;

        setIsUpdating(true);
        router.put(updateClient(editingClient.id).url, editForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditDialogOpen(false);
                setEditingClient(null);
            },
            onFinish: () => setIsUpdating(false),
        });
    };

    const openDeleteDialog = (client: Client) => {
        setDeletingClient(client);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (!deletingClient) return;

        setIsDeleting(true);
        router.delete(destroyClient(deletingClient.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setDeletingClient(null);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const getPageUrl = (page: number) => {
        return indexClients({
            query: {
                page: page > 1 ? page : undefined,
                search: filters.search || undefined,
            },
        }).url;
    };

    const generatePaginationPages = () => {
        const { current_page, last_page } = clients;
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clientes" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative max-w-sm flex-1">
                        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            placeholder="Buscar clientes..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    {permissions.canCreate && (
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <PlusIcon className="mr-2 size-4" />
                            Nuevo Cliente
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Tipo Documento</TableHead>
                                <TableHead>Numero Documento</TableHead>
                                <TableHead>Creado por</TableHead>
                                <TableHead>Fecha de Creacion</TableHead>
                                {(permissions.canUpdate || permissions.canDelete) && (
                                    <TableHead className="w-12"></TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={(permissions.canUpdate || permissions.canDelete) ? 7 : 6}
                                        className="text-muted-foreground py-8 text-center"
                                    >
                                        No se encontraron clientes
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clients.data.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-medium">
                                            {client.nombre}
                                        </TableCell>
                                        <TableCell>{client.email}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    client.tipo_documento === 'RUC'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {client.tipo_documento}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{client.numero_documento}</TableCell>
                                        <TableCell>{client.creator?.name}</TableCell>
                                        <TableCell>
                                            {new Date(
                                                client.created_at
                                            ).toLocaleDateString('es-PE')}
                                        </TableCell>
                                        {(permissions.canUpdate || permissions.canDelete) && (
                                            <TableCell>
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
                                                        {permissions.canUpdate && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openEditDialog(client)
                                                                }
                                                            >
                                                                Editar
                                                            </DropdownMenuItem>
                                                        )}
                                                        {permissions.canUpdate && permissions.canDelete && (
                                                            <DropdownMenuSeparator />
                                                        )}
                                                        {permissions.canDelete && (
                                                            <DropdownMenuItem
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    openDeleteDialog(client)
                                                                }
                                                            >
                                                                Eliminar
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {clients.last_page > 1 && (
                    <div className="flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row">
                        <p className="text-muted-foreground text-sm">
                            Mostrando {clients.from} a {clients.to} de {clients.total} clientes
                        </p>
                        <Pagination className="mx-0 w-auto">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={getPageUrl(clients.current_page - 1)}
                                        disabled={clients.current_page === 1}
                                    />
                                </PaginationItem>

                                {generatePaginationPages().map((page, index) => (
                                    <PaginationItem key={index}>
                                        {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                                            <PaginationEllipsis />
                                        ) : (
                                            <PaginationLink
                                                href={getPageUrl(page)}
                                                isActive={page === clients.current_page}
                                            >
                                                {page}
                                            </PaginationLink>
                                        )}
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    <PaginationNext
                                        href={getPageUrl(clients.current_page + 1)}
                                        disabled={clients.current_page === clients.last_page}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}

                {/* Create Client Dialog */}
                <Dialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Crear Cliente</DialogTitle>
                            <DialogDescription>
                                Ingresa los datos del nuevo cliente.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="create-nombre">Nombre</Label>
                                <Input
                                    id="create-nombre"
                                    value={createForm.nombre}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            nombre: e.target.value,
                                        }))
                                    }
                                    placeholder="Nombre o razon social"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-email">Email</Label>
                                <Input
                                    id="create-email"
                                    type="email"
                                    value={createForm.email}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            email: e.target.value,
                                        }))
                                    }
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-tipo-documento">
                                    Tipo de Documento
                                </Label>
                                <Select
                                    value={createForm.tipo_documento}
                                    onValueChange={(value: 'DNI' | 'RUC') =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            tipo_documento: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger id="create-tipo-documento">
                                        <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DNI">DNI</SelectItem>
                                        <SelectItem value="RUC">RUC</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-numero-documento">
                                    Numero de Documento
                                </Label>
                                <Input
                                    id="create-numero-documento"
                                    value={createForm.numero_documento}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            numero_documento: e.target.value,
                                        }))
                                    }
                                    placeholder={
                                        createForm.tipo_documento === 'DNI'
                                            ? '12345678'
                                            : '12345678901'
                                    }
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button
                                onClick={handleCreate}
                                disabled={
                                    isCreating ||
                                    !createForm.nombre ||
                                    !createForm.email ||
                                    !createForm.numero_documento
                                }
                            >
                                {isCreating ? 'Creando...' : 'Crear Cliente'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Client Dialog */}
                <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Editar Cliente</DialogTitle>
                            <DialogDescription>
                                Modifica los datos del cliente.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-nombre">Nombre</Label>
                                <Input
                                    id="edit-nombre"
                                    value={editForm.nombre}
                                    onChange={(e) =>
                                        setEditForm((prev) => ({
                                            ...prev,
                                            nombre: e.target.value,
                                        }))
                                    }
                                    placeholder="Nombre o razon social"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) =>
                                        setEditForm((prev) => ({
                                            ...prev,
                                            email: e.target.value,
                                        }))
                                    }
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-tipo-documento">
                                    Tipo de Documento
                                </Label>
                                <Select
                                    value={editForm.tipo_documento}
                                    onValueChange={(value: 'DNI' | 'RUC') =>
                                        setEditForm((prev) => ({
                                            ...prev,
                                            tipo_documento: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger id="edit-tipo-documento">
                                        <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DNI">DNI</SelectItem>
                                        <SelectItem value="RUC">RUC</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-numero-documento">
                                    Numero de Documento
                                </Label>
                                <Input
                                    id="edit-numero-documento"
                                    value={editForm.numero_documento}
                                    onChange={(e) =>
                                        setEditForm((prev) => ({
                                            ...prev,
                                            numero_documento: e.target.value,
                                        }))
                                    }
                                    placeholder={
                                        editForm.tipo_documento === 'DNI'
                                            ? '12345678'
                                            : '12345678901'
                                    }
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button
                                onClick={handleUpdate}
                                disabled={
                                    isUpdating ||
                                    !editForm.nombre ||
                                    !editForm.email ||
                                    !editForm.numero_documento
                                }
                            >
                                {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Client Dialog */}
                <AlertDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar Cliente</AlertDialogTitle>
                            <AlertDialogDescription>
                                ¿Estas seguro de eliminar al cliente &quot;
                                {deletingClient?.nombre}&quot;? Esta accion no se
                                puede deshacer.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="bg-destructive text-white hover:bg-destructive/90"
                            >
                                {isDeleting ? 'Eliminando...' : 'Eliminar'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
