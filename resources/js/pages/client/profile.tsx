import { Form, Head } from '@inertiajs/react';

import { update as updatePassword } from '@/actions/App/Http/Controllers/Client/ClientPasswordController';
import { update as updateProfile } from '@/actions/App/Http/Controllers/Client/ClientProfileController';
import { ClientPortalHeader } from '@/components/client-portal-header';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

interface ProfileProps {
    client: {
        id: number;
        nombre: string;
        email: string;
        tipo_documento: string;
        numero_documento: string;
    };
}

export default function ClientProfile({ client }: ProfileProps) {
    return (
        <>
            <Head title="Perfil - Portal de Clientes"/>

            <div className="bg-background min-h-screen">
                <ClientPortalHeader />

                <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                    {/* Section A: Personal Data */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos Personales</CardTitle>
                            <CardDescription>Actualiza tu informacion de contacto y documento.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                action={updateProfile.url()}
                                method="put"
                            >
                                {({ processing, errors, recentlySuccessful }) => (
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="nombre">Nombre</Label>
                                            <Input
                                                id="nombre"
                                                name="nombre"
                                                defaultValue={client.nombre}
                                            />
                                            <InputError message={errors.nombre} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                defaultValue={client.email}
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="tipo_documento">Tipo de Documento</Label>
                                                <Select name="tipo_documento" defaultValue={client.tipo_documento}>
                                                    <SelectTrigger id="tipo_documento">
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="DNI">DNI</SelectItem>
                                                        <SelectItem value="RUC">RUC</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.tipo_documento} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="numero_documento">Numero de Documento</Label>
                                                <Input
                                                    id="numero_documento"
                                                    name="numero_documento"
                                                    defaultValue={client.numero_documento}
                                                />
                                                <InputError message={errors.numero_documento} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Button type="submit" disabled={processing}>
                                                {processing && <Spinner />}
                                                Guardar
                                            </Button>
                                            {recentlySuccessful && (
                                                <span className="text-sm text-green-600 dark:text-green-400">
                                                    Guardado correctamente.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Form>
                        </CardContent>
                    </Card>

                    {/* Section B: Change Password */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Cambiar Contrasena</CardTitle>
                            <CardDescription>Actualiza tu contrasena de acceso al portal.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                action={updatePassword.url()}
                                method="put"
                                resetOnSuccess={['current_password', 'password', 'password_confirmation']}
                            >
                                {({ processing, errors, recentlySuccessful }) => (
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="current_password">Contrasena actual</Label>
                                            <Input
                                                id="current_password"
                                                name="current_password"
                                                type="password"
                                                autoComplete="current-password"
                                            />
                                            <InputError message={errors.current_password} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password">Nueva contrasena</Label>
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                autoComplete="new-password"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password_confirmation">Confirmar nueva contrasena</Label>
                                            <Input
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                type="password"
                                                autoComplete="new-password"
                                            />
                                            <InputError message={errors.password_confirmation} />
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Button type="submit" disabled={processing}>
                                                {processing && <Spinner />}
                                                Cambiar Contrasena
                                            </Button>
                                            {recentlySuccessful && (
                                                <span className="text-sm text-green-600 dark:text-green-400">
                                                    Contrasena actualizada.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </>
    );
}
