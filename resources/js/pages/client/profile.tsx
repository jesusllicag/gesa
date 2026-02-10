import { initMercadoPago } from '@mercadopago/sdk-react';
import { Form, Head, router } from '@inertiajs/react';
import { CreditCardIcon, Trash2Icon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { destroy as destroyCard, store as storeCard } from '@/actions/App/Http/Controllers/Client/ClientCardController';
import { update as updatePassword } from '@/actions/App/Http/Controllers/Client/ClientPasswordController';
import { update as updateProfile } from '@/actions/App/Http/Controllers/Client/ClientProfileController';
import { ClientPortalHeader } from '@/components/client-portal-header';
import InputError from '@/components/input-error';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

interface TarjetaCliente {
    id: number;
    mp_card_id: string;
    last_four_digits: string;
    first_six_digits: string;
    brand: string;
    expiration_month: number;
    expiration_year: number;
    cardholder_name: string;
    payment_type: string;
}

interface ProfileProps {
    client: {
        id: number;
        nombre: string;
        email: string;
        tipo_documento: string;
        numero_documento: string;
    };
    tarjetas: TarjetaCliente[];
    mpPublicKey: string | null;
}

const brandLabels: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    diners: 'Diners Club',
    elo: 'Elo',
    hipercard: 'Hipercard',
};

function CardForm({ mpPublicKey }: { mpPublicKey: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cardFormRef = useRef<ReturnType<typeof window.mp.cardForm> | null>(null);
    const formContainerRef = useRef<HTMLDivElement>(null);

    const initCardForm = useCallback(async () => {
        try {
            await initMercadoPago(mpPublicKey, { locale: 'es-PE' });
            
            cardFormRef.current = mp.cardForm({
                amount: '100',
                iframe: true,
                form: {
                    id: 'mp-card-form',
                    cardNumber: { id: 'mp-card-number', placeholder: 'Numero de tarjeta' },
                    expirationDate: { id: 'mp-expiration-date', placeholder: 'MM/YY' },
                    securityCode: { id: 'mp-security-code', placeholder: 'CVV' },
                    cardholderName: { id: 'mp-cardholder-name', placeholder: 'Nombre en la tarjeta' },
                    identificationType: { id: 'mp-identification-type' },
                    identificationNumber: { id: 'mp-identification-number', placeholder: 'Numero de documento' },
                },
                callbacks: {
                    onFormMounted: (err: unknown) => {
                        if (err) {
                            setError('Error al cargar el formulario de pago.');
                        }
                    },
                    onSubmit: (event: Event) => {
                        event.preventDefault();
                        setIsLoading(true);
                        setError(null);

                        const cardFormData = cardFormRef.current?.getCardFormData();
                        if (!cardFormData?.token) {
                            setError('No se pudo generar el token de la tarjeta.');
                            setIsLoading(false);
                            return;
                        }

                        router.post(storeCard.url(), { token: cardFormData.token }, {
                            preserveScroll: true,
                            onSuccess: () => {
                                setShowForm(false);
                                cardFormRef.current?.unmount();
                                cardFormRef.current = null;
                            },
                            onError: (errors) => {
                                setError(Object.values(errors).join(' '));
                            },
                            onFinish: () => setIsLoading(false),
                        });
                    },
                    onFetching: (resource: string) => {
                        const progressBar = document.querySelector('.mp-progress-bar');
                        if (progressBar) {
                            progressBar.removeAttribute('value');
                        }
                        return () => {
                            if (progressBar) {
                                progressBar.setAttribute('value', '0');
                            }
                        };
                    },
                },
            });
        } catch {
            setError('Error al inicializar MercadoPago.');
        }
    }, [mpPublicKey]);

    useEffect(() => {
        if (showForm) {
            initCardForm();
        }

        return () => {
            if (cardFormRef.current) {
                cardFormRef.current.unmount();
                cardFormRef.current = null;
            }
        };
    }, [showForm, initCardForm]);

    if (!showForm) {
        return (
            <Button variant="outline" onClick={() => setShowForm(true)}>
                <CreditCardIcon className="mr-2 size-4" />
                Agregar Tarjeta
            </Button>
        );
    }

    return (
        <div ref={formContainerRef} className="rounded-lg border p-4">
            <form id="mp-card-form" className="grid gap-4">
                <div className="grid gap-2">
                    <Label>Numero de tarjeta</Label>
                    <div id="mp-card-number" className="h-10 rounded-md border" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Vencimiento</Label>
                        <div id="mp-expiration-date" className="h-10 rounded-md border" />
                    </div>
                    <div className="grid gap-2">
                        <Label>CVV</Label>
                        <div id="mp-security-code" className="h-10 rounded-md border" />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>Nombre en la tarjeta</Label>
                    <div id="mp-cardholder-name" className="h-10 rounded-md border" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Tipo de documento</Label>
                        <select id="mp-identification-type" className="border-input bg-background h-10 rounded-md border px-3 text-sm" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Numero de documento</Label>
                        <div id="mp-identification-number" className="h-10 rounded-md border" />
                    </div>
                </div>

                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                <progress className="mp-progress-bar" value="0" />

                <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Spinner />}
                        Guardar Tarjeta
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setShowForm(false);
                            cardFormRef.current?.unmount();
                            cardFormRef.current = null;
                        }}
                    >
                        Cancelar
                    </Button>
                </div>
            </form>
        </div>
    );
}

function DeleteCardButton({ tarjeta }: { tarjeta: TarjetaCliente }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(destroyCard.url(tarjeta.id), {
            preserveScroll: true,
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive size-8">
                    <Trash2Icon className="size-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar tarjeta</AlertDialogTitle>
                    <AlertDialogDescription>
                        Se eliminara la tarjeta terminada en {tarjeta.last_four_digits}. Esta accion no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default function ClientProfile({ client, tarjetas, mpPublicKey }: ProfileProps) {
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
                                {({ processing, errors, wasSuccessful, recentlySuccessful }) => (
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

                    {/* Section C: Payment Methods */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Medios de Pago</CardTitle>
                            <CardDescription>Gestiona tus tarjetas de pago guardadas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {tarjetas.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-8">
                                        <CreditCardIcon className="text-muted-foreground size-12 opacity-50" />
                                        <p className="text-muted-foreground text-sm">No tienes tarjetas guardadas.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {tarjetas.map((tarjeta) => (
                                            <div
                                                key={tarjeta.id}
                                                className="flex items-center justify-between rounded-lg border p-4"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <CreditCardIcon className="text-muted-foreground size-8" />
                                                    <div>
                                                        <p className="font-medium">
                                                            {brandLabels[tarjeta.brand] ?? tarjeta.brand} **** {tarjeta.last_four_digits}
                                                        </p>
                                                        <p className="text-muted-foreground text-sm">
                                                            {tarjeta.cardholder_name} - Vence {String(tarjeta.expiration_month).padStart(2, '0')}/{tarjeta.expiration_year}
                                                        </p>
                                                    </div>
                                                </div>
                                                <DeleteCardButton tarjeta={tarjeta} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {mpPublicKey && <CardForm mpPublicKey={mpPublicKey} />}
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </>
    );
}
