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
}: {
    roles: { id: number; name: string }[] | null;
}) {
    console.log(roles);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuarios" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Select>
                    <SelectTrigger className="w-[180px]">
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
                <ButtonGroup>
                    <Button>Button 1</Button>
                    <Button>Button 2</Button>
                </ButtonGroup>
                <Dialog>
                    <form>
                        <DialogTrigger asChild>
                            <Button variant="outline">Open Dialog</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Edit profile</DialogTitle>
                                <DialogDescription>
                                    Make changes to your profile here. Click
                                    save when you&apos;re done.
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
                                    <Label htmlFor="username-1">Username</Label>
                                    <Input
                                        id="username-1"
                                        name="username"
                                        defaultValue="@peduarte"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Save changes</Button>
                            </DialogFooter>
                        </DialogContent>
                    </form>
                </Dialog>
                <Separator />
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
                    <Field orientation="horizontal" data-disabled>
                        <Checkbox
                            id="toggle-checkbox"
                            name="toggle-checkbox"
                            disabled
                        />
                        <FieldLabel htmlFor="toggle-checkbox">
                            Enable notifications
                        </FieldLabel>
                    </Field>
                    <FieldLabel>
                        <Field orientation="horizontal">
                            <Checkbox
                                id="toggle-checkbox-2"
                                name="toggle-checkbox-2"
                            />
                            <FieldContent>
                                <FieldTitle>Enable notifications</FieldTitle>
                                <FieldDescription>
                                    You can enable or disable notifications at
                                    any time.
                                </FieldDescription>
                            </FieldContent>
                        </Field>
                    </FieldLabel>
                </FieldGroup>
            </div>
        </AppLayout>
    );
}
