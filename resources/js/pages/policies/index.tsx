'use client';
import { Head } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { index as indexPolicies } from '@/routes/policies';
import { BreadcrumbItem } from '@/types';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldTitle,
} from '@/components/ui/field';
import { Label } from '@/components/ui/label';

import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

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
    roles: any[] | null;
    permissions: any[] | null;
}) {
    console.log(roles);
    console.log(permissions);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuarios" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="gap-4 lg:flex lg:items-center lg:justify-between">
                    <Select>
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
                        <ButtonGroup>
                            <Button variant="outline">Editar</Button>
                            <Button variant="outline">Eliminar</Button>
                        </ButtonGroup>

                        <Dialog>
                            <form>
                                <DialogTrigger asChild>
                                    <Button>Crear Nuevo Rol</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Edit profile</DialogTitle>
                                        <DialogDescription>
                                            Make changes to your profile here.
                                            Click save when you&apos;re done.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4">
                                        <div className="grid gap-3">
                                            <Label htmlFor="name-1">Name</Label>
                                            <Input
                                                id="name-1"
                                                name="name"
                                                defaultValue="Pedro Duarte"
                                            />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="username-1">
                                                Username
                                            </Label>
                                            <Input
                                                id="username-1"
                                                name="username"
                                                defaultValue="@peduarte"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button type="submit">
                                            Save changes
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </form>
                        </Dialog>
                    </div>
                </div>

                <Separator />
                <FieldGroup className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <FieldLabel>
                        <Field orientation="horizontal">
                            <Checkbox
                                id="toggle-checkbox-2"
                                name="toggle-checkbox-2"
                            />
                            <FieldContent>
                                <FieldTitle>Solo lectura</FieldTitle>
                                <FieldDescription>
                                    You can enable or disable notifications at
                                    any time.
                                </FieldDescription>
                            </FieldContent>
                        </Field>
                    </FieldLabel>
                    <FieldLabel>
                        <Field orientation="horizontal">
                            <Checkbox
                                id="toggle-checkbox-2"
                                name="toggle-checkbox-2"
                            />
                            <FieldContent>
                                <FieldTitle>Solo lectura</FieldTitle>
                                <FieldDescription>
                                    You can enable or disable notifications at
                                    any time.
                                </FieldDescription>
                            </FieldContent>
                        </Field>
                    </FieldLabel>
                </FieldGroup>
                {permissions?.map((permission) => (
                    <div key={permission.id}>{permission.name}</div>
                ))}
                <FieldGroup className="max-w-sm">
                    <Field orientation="horizontal">
                        <Checkbox id="terms-checkbox" name="terms-checkbox" />
                        <Label htmlFor="terms-checkbox">
                            Accept terms and conditions
                        </Label>
                    </Field>
                    <Field orientation="horizontal">
                        <Checkbox
                            id="terms-checkbox-2"
                            name="terms-checkbox-2"
                            defaultChecked
                        />
                        <FieldContent>
                            <FieldLabel htmlFor="terms-checkbox-2">
                                Accept terms and conditions
                            </FieldLabel>
                            <FieldDescription>
                                By clicking this checkbox, you agree to the
                                terms.
                            </FieldDescription>
                        </FieldContent>
                    </Field>
                </FieldGroup>
            </div>
        </AppLayout>
    );
}
