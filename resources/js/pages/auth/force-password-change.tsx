import { Form, Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

export default function ForcePasswordChange() {
    return (
        <AuthLayout
            title="Cambiar contrasena"
            description="Por seguridad, debes cambiar tu contrasena temporal antes de continuar."
        >
            <Head title="Cambiar contrasena" />

            <Form
                action="/password/force-change"
                method="put"
                resetOnSuccess={['current_password', 'password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="current_password">Contrasena actual</Label>
                            <Input
                                id="current_password"
                                type="password"
                                name="current_password"
                                autoComplete="current-password"
                                className="mt-1 block w-full"
                                autoFocus
                                placeholder="Contrasena temporal"
                            />
                            <InputError message={errors.current_password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Nueva contrasena</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                placeholder="Nueva contrasena"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirmar nueva contrasena
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                placeholder="Confirmar nueva contrasena"
                            />
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Cambiar contrasena
                        </Button>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
