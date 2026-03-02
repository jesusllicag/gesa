import { Head, router } from '@inertiajs/react';
import {
    AlertTriangleIcon,
    CheckCircleIcon,
    GlobeIcon,
    HardDriveIcon,
    LockIcon,
    ServerIcon,
    XCircleIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ClientPortalHeader } from '@/components/client-portal-header';
import { CostPreview } from '@/components/cost-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { calcularCostoDiario } from '@/lib/server-costs';

declare global {
    interface Window {
        MercadoPago: new (publicKey: string) => MercadoPagoInstance;
    }
}

interface MPField {
    mount: (containerId: string) => MPField;
    update: (settings: object) => void;
    on: (event: string, callback: (data: { bin?: string }) => void) => void;
}

interface MercadoPagoInstance {
    fields: {
        create: (type: string, options: object) => MPField;
        createCardToken: (data: object) => Promise<{ id: string }>;
    };
    getIdentificationTypes: () => Promise<Array<{ id: string; name: string }>>;
    getPaymentMethods: (params: { bin: string }) => Promise<{ results: MercadoPagoPaymentMethod[] }>;
    getIssuers: (params: { paymentMethodId: string; bin: string }) => Promise<Array<{ id: string; name: string }>>;
    getInstallments: (params: { amount: number; bin: string; paymentTypeId: string }) => Promise<Array<{ payer_costs: Array<{ installments: number; recommended_message: string }> }>>;
}

interface MercadoPagoPaymentMethod {
    id: string;
    additional_info_needed: string[];
    issuer: { id: string; name: string };
    settings: Array<{
        card_number: object;
        security_code: object;
    }>;
}

interface Server {
    id: string;
    nombre: string;
    hostname: string | null;
    ram_gb: number;
    disco_gb: number;
    disco_tipo: 'SSD' | 'HDD';
    conexion: 'publica' | 'privada';
    costo_diario: number;
    token_aprobacion: string;
    region: { id: number; codigo: string; nombre: string };
    operating_system: { id: number; nombre: string; logo: string };
    image: { id: number; nombre: string; version: string; arquitectura: string };
    instance_type: {
        id: number;
        nombre: string;
        familia: string;
        vcpus: number;
        procesador: string;
        memoria_gb: number;
        rendimiento_red: string;
        precio_hora: number;
    };
}

interface Props {
    server: Server;
    mercadopago_public_key: string | null;
}

const initialMpForm = {
    cardholderName: '',
    identificationType: '',
    identificationNumber: '',
    installments: '1',
    issuerId: '',
    paymentMethodId: '',
};

export default function ServerApproval({ server, mercadopago_public_key }: Props) {
    const [medioPago, setMedioPago] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);

    const [mpForm, setMpForm] = useState({ ...initialMpForm });
    const [identificationTypes, setIdentificationTypes] = useState<Array<{ id: string; name: string }>>([]);
    const [issuers, setIssuers] = useState<Array<{ id: string; name: string }>>([]);
    const [installmentOptions, setInstallmentOptions] = useState<Array<{ installments: number; recommended_message: string }>>([]);

    const mpInstanceRef = useRef<MercadoPagoInstance | null>(null);
    const cardNumberElementRef = useRef<MPField | null>(null);
    const securityCodeElementRef = useRef<MPField | null>(null);
    const mpFieldsMountedRef = useRef(false);

    const desglose = useMemo(() => {
        return calcularCostoDiario(
            server.instance_type,
            server.ram_gb,
            server.disco_gb,
            server.disco_tipo,
            server.conexion,
        );
    }, [server]);

    useEffect(() => {
        if (medioPago !== 'tarjeta_credito' || !mercadopago_public_key || mpFieldsMountedRef.current) {
            return;
        }

        const initMercadoPago = async () => {
            if (!window.MercadoPago) {
                const script = document.createElement('script');
                script.src = 'https://sdk.mercadopago.com/js/v2';
                script.async = true;
                document.body.appendChild(script);
                await new Promise<void>((resolve) => {
                    script.onload = () => resolve();
                });
            }

            const mp = new window.MercadoPago(mercadopago_public_key);
            mpInstanceRef.current = mp;
            mpFieldsMountedRef.current = true;

            const cardNumberElement = mp.fields
                .create('cardNumber', { placeholder: 'Numero de tarjeta' })
                .mount('mp-card-number');
            cardNumberElementRef.current = cardNumberElement;

            mp.fields.create('expirationDate', { placeholder: 'MM/AA' }).mount('mp-expiration-date');

            const securityCodeElement = mp.fields
                .create('securityCode', { placeholder: 'CVV' })
                .mount('mp-security-code');
            securityCodeElementRef.current = securityCodeElement;

            try {
                const types = await mp.getIdentificationTypes();
                setIdentificationTypes(types);
                if (types.length > 0) {
                    setMpForm((prev) => ({ ...prev, identificationType: types[0].id }));
                }
            } catch (e) {
                console.error('[MP] Error al obtener tipos de identificacion:', e);
            }

            let currentBin: string | undefined;
            cardNumberElement.on('binChange', async (data) => {
                const { bin } = data;
                try {
                    if (!bin) {
                        setMpForm((prev) => ({ ...prev, paymentMethodId: '', issuerId: '', installments: '' }));
                        setIssuers([]);
                        setInstallmentOptions([]);
                        return;
                    }
                    if (bin && bin !== currentBin) {
                        const { results } = await mp.getPaymentMethods({ bin });
                        const paymentMethod = results[0];
                        setMpForm((prev) => ({ ...prev, paymentMethodId: paymentMethod.id }));

                        if (paymentMethod.settings?.[0]) {
                            cardNumberElement.update({ settings: paymentMethod.settings[0].card_number });
                            securityCodeElement.update({ settings: paymentMethod.settings[0].security_code });
                        }

                        let issuerOptions: Array<{ id: string; name: string }> = [];
                        if (paymentMethod.additional_info_needed?.includes('issuer_id')) {
                            issuerOptions = await mp.getIssuers({ paymentMethodId: paymentMethod.id, bin });
                        } else if (paymentMethod.issuer) {
                            issuerOptions = [paymentMethod.issuer as { id: string; name: string }];
                        }
                        setIssuers(issuerOptions);
                        if (issuerOptions.length > 0) {
                            setMpForm((prev) => ({ ...prev, issuerId: String(issuerOptions[0].id) }));
                        }

                        const transactionAmount = desglose.total * 30;
                        const installmentsData = await mp.getInstallments({
                            amount: transactionAmount,
                            bin,
                            paymentTypeId: 'credit_card',
                        });
                        const payerCosts = installmentsData[0]?.payer_costs ?? [];
                        setInstallmentOptions(payerCosts);
                        if (payerCosts.length > 0) {
                            setMpForm((prev) => ({ ...prev, installments: String(payerCosts[0].installments) }));
                        }
                    }
                    currentBin = bin;
                } catch (e) {
                    console.error('[MP] Error en binChange:', e);
                }
            });
        };

        initMercadoPago();
    }, [medioPago, mercadopago_public_key, desglose.total]);

    const handleMedioPagoChange = (value: string) => {
        setMedioPago(value);
        setPaymentError(null);
        if (value !== 'tarjeta_credito') {
            mpFieldsMountedRef.current = false;
        }
    };

    const handleApproveTransferencia = () => {
        console.log('[ServerApproval] Aprobando servidor por transferencia bancaria:', server.nombre);
        setIsSubmitting(true);
        router.post(
            `/client/servers/${server.token_aprobacion}/approve`,
            { medio_pago: 'transferencia_bancaria' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    console.log('[ServerApproval] Servidor aprobado exitosamente (transferencia)');
                },
                onError: (errors) => {
                    console.log('[ServerApproval] Error al aprobar servidor (transferencia):', errors);
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleApproveTarjeta = async () => {
        console.log('[ServerApproval] Aprobando servidor por tarjeta de crédito:', server.nombre);
        setPaymentError(null);
        setIsSubmitting(true);

        try {
            const mp = mpInstanceRef.current;
            if (!mp) {
                throw new Error('MercadoPago no inicializado');
            }

            const token = await mp.fields.createCardToken({
                cardholderName: mpForm.cardholderName,
                identificationType: mpForm.identificationType,
                identificationNumber: mpForm.identificationNumber,
            });

            console.log('[ServerApproval] Token de tarjeta generado, enviando aprobación...');

            router.post(
                `/client/servers/${server.token_aprobacion}/approve`,
                {
                    medio_pago: 'tarjeta_credito',
                    token: token.id,
                    installments: Number(mpForm.installments),
                    payment_method_id: mpForm.paymentMethodId,
                    issuer_id: mpForm.issuerId ? Number(mpForm.issuerId) : null,
                    identification_type: mpForm.identificationType || null,
                    identification_number: mpForm.identificationNumber || null,
                    cardholder_name: mpForm.cardholderName || null,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        console.log('[ServerApproval] Servidor aprobado exitosamente (tarjeta)');
                    },
                    onError: (errors) => {
                        console.log('[ServerApproval] Error al aprobar servidor (tarjeta):', errors);
                        const paymentErr = (errors as Record<string, string>).payment;
                        setPaymentError(paymentErr ?? 'Error al procesar el pago.');
                    },
                    onFinish: () => setIsSubmitting(false),
                }
            );
        } catch (e) {
            console.log('[ServerApproval] Error al tokenizar tarjeta:', e);
            setPaymentError('Error al tokenizar la tarjeta. Verifica los datos ingresados.');
            setIsSubmitting(false);
        }
    };

    const handleReject = () => {
        console.log('[ServerApproval] Rechazando servidor:', server.nombre);
        setIsSubmitting(true);
        router.post(
            `/client/servers/${server.token_aprobacion}/reject`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    console.log('[ServerApproval] Servidor rechazado exitosamente');
                },
                onError: (errors) => {
                    console.log('[ServerApproval] Error al rechazar servidor:', errors);
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const canApprove = medioPago === 'transferencia_bancaria' || medioPago === 'tarjeta_credito';

    return (
        <>
            <Head title="Revision de Servidor - Portal de Clientes" />

            <div className="bg-background min-h-screen">
                <ClientPortalHeader />

                <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900">
                            <ServerIcon className="size-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Revision de Servidor</h1>
                            <p className="text-muted-foreground text-sm">
                                Un administrador ha preparado este servidor para tu cuenta. Revisa los detalles y decide si lo aceptas.
                            </p>
                        </div>
                    </div>

                    {/* Server Details Card */}
                    <div className="mb-6 rounded-lg border p-6">
                        <h2 className="mb-4 text-lg font-semibold">{server.nombre}</h2>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Region</span>
                                    <Badge variant="outline">{server.region?.codigo}</Badge>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Sistema Operativo</span>
                                    <div className="flex items-center gap-1">
                                        <img
                                            src={server.operating_system?.logo}
                                            alt={server.operating_system?.nombre}
                                            className="size-4 object-contain dark:invert"
                                        />
                                        <span>{server.operating_system?.nombre}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Imagen</span>
                                    <span className="font-mono text-xs">{server.image?.nombre} {server.image?.version}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tipo Instancia</span>
                                    <span className="font-mono text-xs">{server.instance_type?.nombre}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">vCPUs</span>
                                    <span>{server.instance_type?.vcpus}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">RAM</span>
                                    <span>{server.ram_gb} GB</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Disco</span>
                                    <div className="flex items-center gap-1">
                                        <HardDriveIcon className="size-3 text-muted-foreground" />
                                        <span>{server.disco_gb} GB {server.disco_tipo}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Conexion</span>
                                    {server.conexion === 'publica' ? (
                                        <div className="flex items-center gap-1 text-green-600">
                                            <GlobeIcon className="size-3" />
                                            <span>Publica</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-amber-600">
                                            <LockIcon className="size-3" />
                                            <span>Privada</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <CostPreview desglose={desglose} />
                            <p className="text-muted-foreground mt-2 text-xs">
                                Costo mensual estimado: <span className="font-semibold text-green-700 dark:text-green-400">${(desglose.total * 30).toFixed(2)}/mes</span>
                            </p>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="mb-6 rounded-lg border p-6">
                        <h2 className="mb-4 text-lg font-semibold">Medio de Pago</h2>

                        <div className="grid gap-2">
                            <Label htmlFor="medio-pago">Selecciona como deseas pagar el primer mes</Label>
                            <Select value={medioPago} onValueChange={handleMedioPagoChange}>
                                <SelectTrigger id="medio-pago">
                                    <SelectValue placeholder="Seleccionar medio de pago" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="transferencia_bancaria">Transferencia Bancaria</SelectItem>
                                    <SelectItem value="tarjeta_credito">Tarjeta de Credito</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {medioPago === 'tarjeta_credito' && (
                            <div className="mt-4 space-y-4">
                                <div className="grid gap-2">
                                    <Label>Numero de Tarjeta</Label>
                                    <div
                                        id="mp-card-number"
                                        className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Vencimiento</Label>
                                        <div
                                            id="mp-expiration-date"
                                            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>CVV</Label>
                                        <div
                                            id="mp-security-code"
                                            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="approval-cardholder">Nombre del Titular</Label>
                                    <input
                                        id="approval-cardholder"
                                        className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                                        placeholder="Como aparece en la tarjeta"
                                        value={mpForm.cardholderName}
                                        onChange={(e) => setMpForm((prev) => ({ ...prev, cardholderName: e.target.value }))}
                                    />
                                </div>

                                {identificationTypes.length > 0 && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="approval-id-type">Tipo Documento</Label>
                                            <Select
                                                value={mpForm.identificationType}
                                                onValueChange={(v) => setMpForm((prev) => ({ ...prev, identificationType: v }))}
                                            >
                                                <SelectTrigger id="approval-id-type">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {identificationTypes.map((t) => (
                                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="approval-id-number">Numero Documento</Label>
                                            <input
                                                id="approval-id-number"
                                                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                                                placeholder="12345678"
                                                value={mpForm.identificationNumber}
                                                onChange={(e) => setMpForm((prev) => ({ ...prev, identificationNumber: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                )}

                                {issuers.length > 1 && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="approval-issuer">Banco Emisor</Label>
                                        <Select
                                            value={mpForm.issuerId}
                                            onValueChange={(v) => setMpForm((prev) => ({ ...prev, issuerId: v }))}
                                        >
                                            <SelectTrigger id="approval-issuer">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {issuers.map((i) => (
                                                    <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {installmentOptions.length > 0 && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="approval-installments">Cuotas</Label>
                                        <Select
                                            value={mpForm.installments}
                                            onValueChange={(v) => setMpForm((prev) => ({ ...prev, installments: v }))}
                                        >
                                            <SelectTrigger id="approval-installments">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {installmentOptions.map((opt) => (
                                                    <SelectItem key={opt.installments} value={String(opt.installments)}>
                                                        {opt.recommended_message}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {paymentError && (
                                    <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                                        <AlertTriangleIcon className="size-4 shrink-0" />
                                        {paymentError}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                        {!showRejectConfirm ? (
                            <>
                                <Button
                                    variant="outline"
                                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
                                    onClick={() => setShowRejectConfirm(true)}
                                    disabled={isSubmitting}
                                >
                                    <XCircleIcon className="mr-2 size-4" />
                                    Rechazar Servidor
                                </Button>

                                <Button
                                    onClick={medioPago === 'tarjeta_credito' ? handleApproveTarjeta : handleApproveTransferencia}
                                    disabled={!canApprove || isSubmitting}
                                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                                >
                                    <CheckCircleIcon className="mr-2 size-4" />
                                    {isSubmitting ? 'Procesando...' : 'Aceptar Servidor'}
                                </Button>
                            </>
                        ) : (
                            <div className="w-full rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/50">
                                <p className="mb-3 text-sm font-medium text-red-700 dark:text-red-300">
                                    ¿Confirmas que deseas rechazar el servidor "{server.nombre}"? Esta accion no se puede deshacer.
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowRejectConfirm(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleReject}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Rechazando...' : 'Si, rechazar'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
