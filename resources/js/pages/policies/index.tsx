'use client';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { index as indexPolicies } from '@/routes/policies';
import {
    destroy as destroyPolicy,
    store as storePolicy,
    update as updatePolicies,
} from '@/actions/App/Http/Controllers/Settings/PolicyController';
import { BreadcrumbItem } from '@/types';

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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface Role {
    id: number;
    name: string;
    permissions: Permission[];
}

interface Permission {
    id: number;
    name: string;
    slug: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Politicas de Permisos',
        href: indexPolicies().url,
    },
];

export default function Policies({
    roles,
    permissions,
}: {
    roles: Role[] | null;
    permissions: Record<string, Permission[]> | null;
}) {
    const { flash } = usePage<{ flash: { newRoleId?: number } }>().props;

    const [selectedRoleId, setSelectedRoleId] = useState<string>('');
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Create role dialog
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Delete role dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const selectedRole = roles?.find((r) => r.id.toString() === selectedRoleId);
    const isProtectedRole = selectedRole && ['admin', 'manager'].includes(selectedRole.name.toLowerCase());

    useEffect(() => {
        if (flash?.newRoleId) {
            setSelectedRoleId(flash.newRoleId.toString());
            setSelectedPermissions([]);
        }
    }, [flash?.newRoleId]);

    useEffect(() => {
        if (selectedRole) {
            setSelectedPermissions(selectedRole.permissions.map((p) => p.id));
        } else {
            setSelectedPermissions([]);
        }
    }, [selectedRoleId, roles]);

    const handleRoleChange = (roleId: string) => {
        setSelectedRoleId(roleId);
    };

    const handlePermissionChange = (permissionId: number, checked: boolean) => {
        setSelectedPermissions((prev) =>
            checked
                ? [...prev, permissionId]
                : prev.filter((id) => id !== permissionId)
        );
    };

    const handleSave = () => {
        if (!selectedRoleId) return;

        setIsSaving(true);
        router.put(
            updatePolicies(selectedRoleId).url,
            { permissions: selectedPermissions },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsSaving(false),
            }
        );
    };

    const handleCreateRole = () => {
        if (!newRoleName.trim()) return;

        setIsCreating(true);
        router.post(
            storePolicy().url,
            { name: newRoleName },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateDialogOpen(false);
                    setNewRoleName('');
                },
                onFinish: () => setIsCreating(false),
            }
        );
    };

    const handleDeleteRole = () => {
        if (!selectedRoleId || isProtectedRole) return;

        setIsDeleting(true);
        router.delete(destroyPolicy(selectedRoleId).url, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedRoleId('');
                setIsDeleteDialogOpen(false);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuarios" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="gap-4 lg:flex lg:items-center lg:justify-between">
                    <Select value={selectedRoleId} onValueChange={handleRoleChange}>
                        <SelectTrigger className="w-full max-w-64">
                            <SelectValue placeholder="Elegir Rol" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles?.map((r) => (
                                <SelectItem key={r.id} value={r.id.toString()}>
                                    {r.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="mt-6 gap-4 space-y-4 sm:flex sm:items-center sm:space-y-0 lg:mt-0 lg:justify-end">
                        {selectedRoleId && (
                            <>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                    disabled={isProtectedRole}
                                    title={isProtectedRole ? 'No se puede eliminar este rol' : ''}
                                >
                                    Eliminar Rol
                                </Button>
                            </>
                        )}

                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>Crear Nuevo Rol</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Crear Nuevo Rol</DialogTitle>
                                    <DialogDescription>
                                        Ingresa el nombre del nuevo rol. Luego podras asignarle permisos.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4">
                                    <div className="grid gap-3">
                                        <Label htmlFor="role-name">Nombre del Rol</Label>
                                        <Input
                                            id="role-name"
                                            name="name"
                                            value={newRoleName}
                                            onChange={(e) => setNewRoleName(e.target.value)}
                                            placeholder="Ej: Supervisor"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleCreateRole();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancelar</Button>
                                    </DialogClose>
                                    <Button onClick={handleCreateRole} disabled={isCreating || !newRoleName.trim()}>
                                        {isCreating ? 'Creando...' : 'Crear Rol'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Eliminar Rol</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        ¿Estas seguro de eliminar el rol &quot;{selectedRole?.name}&quot;? Esta accion no se puede deshacer.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteRole}
                                        disabled={isDeleting}
                                        className="bg-destructive text-white hover:bg-destructive/90"
                                    >
                                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                <Separator />

                {selectedRoleId && permissions && Object.keys(permissions).map((pKey) => (
                    <div key={pKey} className="mb-4">
                        <div className="font-semibold">{pKey}</div>
                        <div className="mt-2 ml-3">
                            {permissions[pKey]?.map((p: Permission) => (
                                <Field key={p.id} className="mb-2" orientation="horizontal">
                                    <Checkbox
                                        id={`permission-${p.id}`}
                                        name={`permission-${p.id}`}
                                        checked={selectedPermissions.includes(p.id)}
                                        onCheckedChange={(checked) =>
                                            handlePermissionChange(p.id, checked as boolean)
                                        }
                                    />
                                    <Label htmlFor={`permission-${p.id}`}>
                                        {p.name}
                                    </Label>
                                </Field>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
