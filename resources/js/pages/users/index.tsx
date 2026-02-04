'use client';
import { Head, router } from '@inertiajs/react';
import { MoreHorizontalIcon, PlusIcon, SearchIcon } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

import {
    destroy as destroyUser,
    store as storeUser,
    update as updateUser,
} from '@/actions/App/Http/Controllers/UserController';
import { index as indexUsers } from '@/routes/users';

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
    roles: Role[];
}

interface PaginatedUsers {
    data: User[];
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Usuarios',
        href: indexUsers().url,
    },
];

export default function Users({
    users,
    roles,
    filters,
}: {
    users: PaginatedUsers;
    roles: Role[];
    filters: { search: string };
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    // Create dialog
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        roles: [] as number[],
    });
    const [isCreating, setIsCreating] = useState(false);

    // Edit dialog
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        password: '',
        roles: [] as number[],
    });
    const [isUpdating, setIsUpdating] = useState(false);

    // Delete dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (value: string) => {
        setSearch(value);

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            router.get(
                indexUsers().url,
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
        router.post(storeUser().url, createForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateDialogOpen(false);
                setCreateForm({ name: '', email: '', roles: [] });
            },
            onError: (errors) => {
                console.error('Error al crear usuario:', errors);
            },
            onFinish: () => setIsCreating(false),
        });
    };

    const openEditDialog = (user: User) => {
        setEditingUser(user);
        setEditForm({
            name: user.name,
            email: user.email,
            password: '',
            roles: user.roles.map((r) => r.id),
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = () => {
        if (!editingUser) return;

        setIsUpdating(true);
        router.put(updateUser(editingUser.id).url, editForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditDialogOpen(false);
                setEditingUser(null);
            },
            onFinish: () => setIsUpdating(false),
        });
    };

    const openDeleteDialog = (user: User) => {
        setDeletingUser(user);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (!deletingUser) return;

        setIsDeleting(true);
        router.delete(destroyUser(deletingUser.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setDeletingUser(null);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const toggleCreateRole = (roleId: number) => {
        setCreateForm((prev) => ({
            ...prev,
            roles: prev.roles.includes(roleId)
                ? prev.roles.filter((id) => id !== roleId)
                : [...prev.roles, roleId],
        }));
    };

    const toggleEditRole = (roleId: number) => {
        setEditForm((prev) => ({
            ...prev,
            roles: prev.roles.includes(roleId)
                ? prev.roles.filter((id) => id !== roleId)
                : [...prev.roles, roleId],
        }));
    };

    const getPageUrl = (page: number) => {
        return indexUsers({
            query: {
                page: page > 1 ? page : undefined,
                search: filters.search || undefined,
            },
        }).url;
    };

    const generatePaginationPages = () => {
        const { current_page, last_page } = users;
        const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];

        // Siempre mostrar primera página
        pages.push(1);

        if (last_page <= 5) {
            // Si hay 5 o menos páginas, mostrar todas
            for (let i = 2; i <= last_page; i++) {
                pages.push(i);
            }
        } else {
            // Lógica para más de 5 páginas
            if (current_page > 3) {
                pages.push('ellipsis-start');
            }

            // Páginas alrededor de la actual
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

            // Siempre mostrar última página
            if (!pages.includes(last_page)) {
                pages.push(last_page);
            }
        }

        return pages;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuarios" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative max-w-sm flex-1">
                        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            placeholder="Buscar usuarios..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <PlusIcon className="mr-2 size-4" />
                        Nuevo Usuario
                    </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Roles</TableHead>
                                <TableHead>Fecha de Creacion</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-muted-foreground py-8 text-center"
                                    >
                                        No se encontraron usuarios
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.name}
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles.length > 0 ? (
                                                    user.roles.map((role) => (
                                                        <Badge
                                                            key={role.id}
                                                            variant="secondary"
                                                        >
                                                            {role.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">
                                                        Sin roles
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                user.created_at
                                            ).toLocaleDateString('es-PE')}
                                        </TableCell>
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
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            openEditDialog(user)
                                                        }
                                                    >
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() =>
                                                            openDeleteDialog(
                                                                user
                                                            )
                                                        }
                                                    >
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row">
                        <p className="text-muted-foreground text-sm">
                            Mostrando {users.from} a {users.to} de {users.total} usuarios
                        </p>
                        <Pagination className="mx-0 w-auto">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={getPageUrl(users.current_page - 1)}
                                        disabled={users.current_page === 1}
                                    />
                                </PaginationItem>

                                {generatePaginationPages().map((page, index) => (
                                    <PaginationItem key={index}>
                                        {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                                            <PaginationEllipsis />
                                        ) : (
                                            <PaginationLink
                                                href={getPageUrl(page)}
                                                isActive={page === users.current_page}
                                            >
                                                {page}
                                            </PaginationLink>
                                        )}
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    <PaginationNext
                                        href={getPageUrl(users.current_page + 1)}
                                        disabled={users.current_page === users.last_page}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}

                {/* Create User Dialog */}
                <Dialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Crear Usuario</DialogTitle>
                            <DialogDescription>
                                Ingresa los datos del nuevo usuario. Se enviara un correo
                                electronico con las instrucciones de acceso y una contrasena temporal.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="create-name">Nombre</Label>
                                <Input
                                    id="create-name"
                                    value={createForm.name}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="Nombre completo"
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
                                <Label>Roles</Label>
                                <div className="flex flex-wrap gap-3">
                                    {roles.map((role) => (
                                        <div
                                            key={role.id}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                id={`create-role-${role.id}`}
                                                checked={createForm.roles.includes(
                                                    role.id
                                                )}
                                                onCheckedChange={() =>
                                                    toggleCreateRole(role.id)
                                                }
                                            />
                                            <Label
                                                htmlFor={`create-role-${role.id}`}
                                                className="cursor-pointer font-normal"
                                            >
                                                {role.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
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
                                    !createForm.name ||
                                    !createForm.email
                                }
                            >
                                {isCreating ? 'Creando...' : 'Crear Usuario'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit User Dialog */}
                <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Editar Usuario</DialogTitle>
                            <DialogDescription>
                                Modifica los datos del usuario. Deja la
                                contrasena vacia para mantener la actual.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Nombre</Label>
                                <Input
                                    id="edit-name"
                                    value={editForm.name}
                                    onChange={(e) =>
                                        setEditForm((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="Nombre completo"
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
                                <Label htmlFor="edit-password">
                                    Nueva Contrasena (opcional)
                                </Label>
                                <Input
                                    id="edit-password"
                                    type="password"
                                    value={editForm.password}
                                    onChange={(e) =>
                                        setEditForm((prev) => ({
                                            ...prev,
                                            password: e.target.value,
                                        }))
                                    }
                                    placeholder="Dejar vacio para mantener"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Roles</Label>
                                <div className="flex flex-wrap gap-3">
                                    {roles.map((role) => (
                                        <div
                                            key={role.id}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                id={`edit-role-${role.id}`}
                                                checked={editForm.roles.includes(
                                                    role.id
                                                )}
                                                onCheckedChange={() =>
                                                    toggleEditRole(role.id)
                                                }
                                            />
                                            <Label
                                                htmlFor={`edit-role-${role.id}`}
                                                className="cursor-pointer font-normal"
                                            >
                                                {role.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
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
                                    !editForm.name ||
                                    !editForm.email
                                }
                            >
                                {isUpdating
                                    ? 'Guardando...'
                                    : 'Guardar Cambios'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete User Dialog */}
                <AlertDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar Usuario</AlertDialogTitle>
                            <AlertDialogDescription>
                                ¿Estas seguro de eliminar al usuario &quot;
                                {deletingUser?.name}&quot;? Esta accion no se
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
