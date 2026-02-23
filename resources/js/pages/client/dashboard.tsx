import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    CopyIcon,
    DownloadIcon,
    GlobeIcon,
    LockIcon,
    PlusIcon,
    ServerIcon,
    XCircleIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { download as downloadServerPdf } from '@/actions/App/Http/Controllers/Client/ClientServerPdfController';
import { ClientPortalHeader } from '@/components/client-portal-header';
import { CostPreview } from '@/components/cost-preview';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    ip_address: string | null;
    entorno: 'DEV' | 'STG' | 'QAS' | 'PROD' | null;
    estado: 'running' | 'stopped' | 'pending' | 'terminated' | 'pendiente_aprobacion';
    costo_diario: number;
    token_aprobacion: string | null;
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

interface OperatingSystem {
    id: number;
    nombre: string;
    logo: string;
    images: Image[];
}

interface Image {
    id: number;
    operating_system_id: number;
    nombre: string;
    version: string;
    arquitectura: '32-bit' | '64-bit';
    ami_id: string;
}

interface InstanceType {
    id: number;
    nombre: string;
    familia: string;
    vcpus: number;
    procesador: string;
    memoria_gb: number;
    rendimiento_red: string;
    precio_hora: number;
}

interface Region {
    id: number;
    codigo: string;
    nombre: string;
}

interface Solicitud {
    id: number;
    nombre: string;
    estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
    medio_pago: string;
    costo_diario_estimado: number;
    motivo_rechazo: string | null;
    created_at: string;
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

interface DashboardProps {
    servers: Server[];
    solicitudes: Solicitud[];
    operatingSystems: OperatingSystem[];
    instanceTypes: InstanceType[];
    regions: Region[];
    mercadopago_public_key: string | null;
}

const entornoColors: Record<string, string> = {
    DEV: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    STG: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    QAS: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    PROD: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const statusConfig = {
    running: { label: 'Ejecutando', variant: 'default' as const, className: 'bg-green-600' },
    stopped: { label: 'Detenido', variant: 'secondary' as const, className: '' },
    pending: { label: 'Pendiente', variant: 'outline' as const, className: 'border-yellow-500 text-yellow-600' },
    terminated: { label: 'Terminado', variant: 'destructive' as const, className: '' },
    pendiente_aprobacion: { label: 'Pendiente Aprobacion', variant: 'outline' as const, className: 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
};

const solicitudEstadoConfig = {
    pendiente: { label: 'Pendiente', icon: ClockIcon, className: 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/50' },
    aprobada: { label: 'Aprobada', icon: CheckCircleIcon, className: 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/50' },
    rechazada: { label: 'Rechazada', icon: XCircleIcon, className: 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/50' },
    cancelada: { label: 'Cancelada', icon: XCircleIcon, className: 'border-gray-500 text-gray-600 bg-gray-50 dark:bg-gray-950/50' },
};

const medioPagoLabels: Record<string, string> = {
    transferencia_bancaria: 'Transferencia Bancaria',
    tarjeta_credito: 'Tarjeta de Credito',
    paypal: 'PayPal',
};

const initialCreateForm = {
    nombre: '',
    region_id: '',
    operating_system_id: '',
    image_id: '',
    instance_type_id: '',
    ram_gb: 4,
    disco_gb: 50,
    disco_tipo: 'SSD' as 'SSD' | 'HDD',
    conexion: 'publica' as 'publica' | 'privada',
    medio_pago: '' as string,
};

const initialMpForm = {
    cardholderName: '',
    identificationType: '',
    identificationNumber: '',
    installments: '1',
    issuerId: '',
    paymentMethodId: '',
};

export default function ClientDashboard({ servers, solicitudes, operatingSystems, instanceTypes, regions, mercadopago_public_key }: DashboardProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ ...initialCreateForm });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [mpForm, setMpForm] = useState({ ...initialMpForm });
    const [identificationTypes, setIdentificationTypes] = useState<Array<{ id: string; name: string }>>([]);
    const [issuers, setIssuers] = useState<Array<{ id: string; name: string }>>([]);
    const [installmentOptions, setInstallmentOptions] = useState<Array<{ installments: number; recommended_message: string }>>([]);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const mpInstanceRef = useRef<MercadoPagoInstance | null>(null);
    const cardNumberElementRef = useRef<MPField | null>(null);
    const securityCodeElementRef = useRef<MPField | null>(null);
    const mpFieldsMountedRef = useRef(false);

    const getStatusBadge = (server: Server) => {
        const config = statusConfig[server.estado] ?? statusConfig.pending;
        return (
            <div className="flex items-center gap-2">
                <Badge variant={config.variant} className={config.className}>
                    {config.label}
                </Badge>
                {server.estado === 'pendiente_aprobacion' && server.token_aprobacion && (
                    <Link
                        href={`/client/servers/${server.token_aprobacion}/review`}
                        className="text-xs font-medium text-amber-600 underline underline-offset-2 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                    >
                        Revisar
                    </Link>
                )}
            </div>
        );
    };

    const costPreview = useMemo(() => {
        const selectedInstanceType = instanceTypes.find(
            (t) => t.id === Number(createForm.instance_type_id),
        );
        return calcularCostoDiario(
            selectedInstanceType,
            createForm.ram_gb,
            createForm.disco_gb,
            createForm.disco_tipo,
            createForm.conexion,
        );
    }, [createForm.instance_type_id, createForm.ram_gb, createForm.disco_gb, createForm.disco_tipo, createForm.conexion, instanceTypes]);

    const handleSubmitSolicitud = () => {
        setIsSubmitting(true);
        router.post(
            '/client/solicitudes',
            {
                ...createForm,
                region_id: Number(createForm.region_id),
                operating_system_id: Number(createForm.operating_system_id),
                image_id: Number(createForm.image_id),
                instance_type_id: Number(createForm.instance_type_id),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateDialogOpen(false);
                    setCreateForm({ ...initialCreateForm });
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleContinueToPayment = () => {
        setPaymentError(null);
        setStep(2);
    };

    const handleDialogClose = (open: boolean) => {
        setIsCreateDialogOpen(open);
        if (!open) {
            setStep(1);
            setMpForm({ ...initialMpForm });
            setIdentificationTypes([]);
            setIssuers([]);
            setInstallmentOptions([]);
            setPaymentError(null);
            setCreateForm({ ...initialCreateForm });
            mpFieldsMountedRef.current = false;
        }
    };

    useEffect(() => {
        if (step !== 2 || !mercadopago_public_key || mpFieldsMountedRef.current) {
            return;
        }

        const initMercadoPago = async () => {
            if (!window.MercadoPago) {
                console.log('[MP] Cargando SDK de MercadoPago...');
                const script = document.createElement('script');
                script.src = 'https://sdk.mercadopago.com/js/v2';
                script.async = true;
                document.body.appendChild(script);
                await new Promise<void>((resolve) => {
                    script.onload = () => resolve();
                });
                console.log('[MP] SDK cargado exitosamente');
            }

            console.log('[MP] Inicializando instancia con clave publica...');
            const mp = new window.MercadoPago(mercadopago_public_key);
            mpInstanceRef.current = mp;
            mpFieldsMountedRef.current = true;
            console.log('[MP] Instancia inicializada, montando campos PCI...');

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
                console.log('[MP] Tipos de identificacion obtenidos:', types);
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

                        const transactionAmount = costPreview.total * 30;
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
                    if (e instanceof Error) {
                        console.error('[MP] Detalle binChange:', e.message);
                    }
                }
            });
        };

        initMercadoPago();
    }, [step, mercadopago_public_key, costPreview.total]);

    const handlePayment = async () => {
        setPaymentError(null);
        setIsSubmitting(true);

        try {
            const mp = mpInstanceRef.current;
            if (!mp) {
                throw new Error('MercadoPago no inicializado');
            }

            console.log('[MP] Creando token de tarjeta...', {
                cardholderName: mpForm.cardholderName,
                identificationType: mpForm.identificationType,
                identificationNumber: mpForm.identificationNumber,
                paymentMethodId: mpForm.paymentMethodId,
                issuerId: mpForm.issuerId,
                installments: mpForm.installments,
            });

            const token = await mp.fields.createCardToken({
                cardholderName: mpForm.cardholderName,
                identificationType: mpForm.identificationType,
                identificationNumber: mpForm.identificationNumber,
            });

            console.log('[MP] Token creado exitosamente:', token.id);

            const payload = {
                nombre: createForm.nombre,
                region_id: Number(createForm.region_id),
                operating_system_id: Number(createForm.operating_system_id),
                image_id: Number(createForm.image_id),
                instance_type_id: Number(createForm.instance_type_id),
                ram_gb: createForm.ram_gb,
                disco_gb: createForm.disco_gb,
                disco_tipo: createForm.disco_tipo,
                conexion: createForm.conexion,
                token: token.id,
                installments: Number(mpForm.installments),
                payment_method_id: mpForm.paymentMethodId,
                issuer_id: mpForm.issuerId ? Number(mpForm.issuerId) : null,
                identification_type: mpForm.identificationType || null,
                identification_number: mpForm.identificationNumber || null,
                cardholder_name: mpForm.cardholderName || null,
            };

            console.log('[MP] Enviando pago al servidor:', payload);

            router.post(
                '/client/pagos/tarjeta',
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        console.log('[MP] Pago procesado exitosamente');
                        setIsCreateDialogOpen(false);
                        setStep(1);
                        setMpForm({ ...initialMpForm });
                        setCreateForm({ ...initialCreateForm });
                        mpFieldsMountedRef.current = false;
                    },
                    onError: (errors) => {
                        console.error('[MP] Error en respuesta del servidor:', errors);
                        const paymentErr = (errors as Record<string, string>).payment;
                        console.error('[MP] Mensaje de error de pago:', paymentErr);
                        setPaymentError(paymentErr ?? 'Error al procesar el pago.');
                    },
                    onFinish: () => setIsSubmitting(false),
                }
            );
        } catch (e) {
            console.error('[MP] Error al crear token de tarjeta:', e);
            if (e instanceof Error) {
                console.error('[MP] Detalle del error:', e.message, e.stack);
            } else {
                console.error('[MP] Error desconocido:', JSON.stringify(e));
            }
            setPaymentError('Error al tokenizar la tarjeta. Verifica los datos ingresados.');
            setIsSubmitting(false);
        }
    };

    const selectedOs = operatingSystems.find(
        (os) => os.id === Number(createForm.operating_system_id)
    );
    const availableImages = selectedOs?.images || [];

    const isStep1Valid =
        !!createForm.nombre &&
        !!createForm.region_id &&
        !!createForm.operating_system_id &&
        !!createForm.image_id &&
        !!createForm.instance_type_id &&
        !!createForm.medio_pago;

    return (
        <>
            <Head title="Dashboard - Portal de Clientes" />

            <div className="bg-background min-h-screen">
                <ClientPortalHeader>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <PlusIcon className="mr-2 size-4" />
                        Solicitar Servidor
                    </Button>
                </ClientPortalHeader>

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Servidores pendientes de aprobacion */}
                    {servers.filter((s) => s.estado === 'pendiente_aprobacion').length > 0 && (
                        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/50">
                            <div className="flex items-start gap-3">
                                <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                                        Tienes {servers.filter((s) => s.estado === 'pendiente_aprobacion').length === 1 ? 'un servidor' : `${servers.filter((s) => s.estado === 'pendiente_aprobacion').length} servidores`} pendiente{servers.filter((s) => s.estado === 'pendiente_aprobacion').length !== 1 ? 's' : ''} de aprobacion
                                    </h3>
                                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                                        Un administrador ha preparado {servers.filter((s) => s.estado === 'pendiente_aprobacion').length === 1 ? 'un servidor' : 'servidores'} para tu cuenta. Revisa los detalles y acepta o rechaza cada uno.
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {servers
                                            .filter((s) => s.estado === 'pendiente_aprobacion' && s.token_aprobacion)
                                            .map((s) => (
                                                <Link
                                                    key={s.id}
                                                    href={`/client/servers/${s.token_aprobacion}/review`}
                                                    className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
                                                >
                                                    <ServerIcon className="size-3.5" />
                                                    Revisar: {s.nombre}
                                                </Link>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Servidores asignados */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">Mis Servidores</h2>
                        <p className="text-muted-foreground text-sm">
                            Servidores asignados a tu cuenta
                        </p>
                    </div>

                    <div className="overflow-x-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Servidor</TableHead>
                                    <TableHead>Hostname</TableHead>
                                    <TableHead>IP</TableHead>
                                    <TableHead>Sistema Operativo</TableHead>
                                    <TableHead>Entorno</TableHead>
                                    <TableHead>Region</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Costo/Dia</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {servers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-muted-foreground py-8 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <ServerIcon className="size-12 opacity-50" />
                                                <p>No tienes servidores asignados</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    servers.map((server) => (
                                        <TableRow
                                            key={server.id}
                                            className={server.estado === 'pendiente_aprobacion' ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}
                                        >
                                            <TableCell>
                                                <span className="font-medium">{server.nombre}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-sm">{server.hostname || '-'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono text-sm">{server.ip_address || '-'}</span>
                                                    {server.ip_address && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-6"
                                                            onClick={() => navigator.clipboard.writeText(server.ip_address!)}
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
                                                            src={server.operating_system?.logo}
                                                            alt={server.operating_system?.nombre}
                                                            className="max-h-5 max-w-5 object-contain dark:invert"
                                                        />
                                                    </div>
                                                    <span className="text-sm">{server.operating_system?.nombre}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {server.entorno ? (
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${entornoColors[server.entorno]}`}
                                                    >
                                                        {server.entorno}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{server.region?.codigo}</Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(server)}</TableCell>
                                            <TableCell>
                                                <span className="font-mono text-sm font-medium text-green-700 dark:text-green-400">
                                                    ${Number(server.costo_diario).toFixed(2)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {server.estado === 'running' && (
                                                    <a href={downloadServerPdf(server.id).url} target="_blank" rel="noreferrer">
                                                        <Button variant="ghost" size="icon" className="size-7" title="Descargar PDF">
                                                            <DownloadIcon className="size-4" />
                                                        </Button>
                                                    </a>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mis Solicitudes */}
                    <div className="mt-10 mb-6">
                        <h2 className="text-lg font-semibold">Mis Solicitudes</h2>
                        <p className="text-muted-foreground text-sm">
                            Solicitudes de servidores enviadas
                        </p>
                    </div>

                    <div className="overflow-x-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Servidor</TableHead>
                                    <TableHead>Sistema Operativo</TableHead>
                                    <TableHead>Tipo Instancia</TableHead>
                                    <TableHead>Region</TableHead>
                                    <TableHead>Medio de Pago</TableHead>
                                    <TableHead>Costo Est./Dia</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Fecha</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {solicitudes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <ClockIcon className="size-12 opacity-50" />
                                                <p>No has enviado solicitudes</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    solicitudes.map((solicitud) => {
                                        const estadoConfig = solicitudEstadoConfig[solicitud.estado];
                                        const EstadoIcon = estadoConfig.icon;
                                        return (
                                            <TableRow key={solicitud.id}>
                                                <TableCell>
                                                    <span className="font-medium">{solicitud.nombre}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex size-5 shrink-0 items-center justify-center">
                                                            <img
                                                                src={solicitud.operating_system?.logo}
                                                                alt={solicitud.operating_system?.nombre}
                                                                className="max-h-5 max-w-5 object-contain dark:invert"
                                                            />
                                                        </div>
                                                        <span className="text-sm">{solicitud.operating_system?.nombre}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-sm">{solicitud.instance_type?.nombre}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{solicitud.region?.codigo}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">{medioPagoLabels[solicitud.medio_pago] || solicitud.medio_pago}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-sm font-medium text-green-700 dark:text-green-400">
                                                        ${Number(solicitud.costo_diario_estimado).toFixed(2)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <EstadoIcon className="size-4" />
                                                        <Badge variant="outline" className={estadoConfig.className}>
                                                            {estadoConfig.label}
                                                        </Badge>
                                                    </div>
                                                    {solicitud.estado === 'rechazada' && solicitud.motivo_rechazo && (
                                                        <p className="mt-1 max-w-48 text-xs text-red-600 dark:text-red-400">
                                                            {solicitud.motivo_rechazo}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-muted-foreground text-sm">
                                                        {new Date(solicitud.created_at).toLocaleDateString()}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </main>
            </div>

            {/* Solicitar Servidor Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    {step === 1 ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>Solicitar Nuevo Servidor</DialogTitle>
                                <DialogDescription>
                                    Configura los parametros del servidor que deseas solicitar. Un administrador revisara tu solicitud.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6">
                                {/* Basic Info */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="solicitud-nombre">Nombre del Servidor</Label>
                                        <Input
                                            id="solicitud-nombre"
                                            value={createForm.nombre}
                                            onChange={(e) =>
                                                setCreateForm((prev) => ({
                                                    ...prev,
                                                    nombre: e.target.value,
                                                }))
                                            }
                                            placeholder="mi-servidor-web"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="solicitud-region">Region</Label>
                                        <Select
                                            value={createForm.region_id}
                                            onValueChange={(value) =>
                                                setCreateForm((prev) => ({
                                                    ...prev,
                                                    region_id: value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger id="solicitud-region">
                                                <SelectValue placeholder="Seleccionar region" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {regions.map((region) => (
                                                    <SelectItem key={region.id} value={String(region.id)}>
                                                        {region.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Operating System */}
                                <div className="grid gap-2">
                                    <Label>Sistema Operativo</Label>
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                                        {operatingSystems.map((os) => (
                                            <button
                                                key={os.id}
                                                type="button"
                                                onClick={() =>
                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        operating_system_id: String(os.id),
                                                        image_id: '',
                                                    }))
                                                }
                                                className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-1 transition-colors hover:bg-accent ${
                                                    createForm.operating_system_id === String(os.id)
                                                        ? 'border-primary bg-accent'
                                                        : ''
                                                }`}
                                            >
                                                <div className="flex size-14 items-center justify-center">
                                                    <img
                                                        src={os.logo}
                                                        alt={os.nombre}
                                                        className="max-h-14 max-w-14 object-contain dark:invert"
                                                    />
                                                </div>
                                                <span className="text-center text-xs">
                                                    {os.nombre}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Image Selection */}
                                {selectedOs && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="solicitud-image">Imagen AMI</Label>
                                        <Select
                                            value={createForm.image_id}
                                            onValueChange={(value) =>
                                                setCreateForm((prev) => ({
                                                    ...prev,
                                                    image_id: value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger id="solicitud-image">
                                                <SelectValue placeholder="Seleccionar imagen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableImages.map((image) => (
                                                    <SelectItem key={image.id} value={String(image.id)}>
                                                        <div className="flex flex-col">
                                                            <span>{image.nombre}</span>
                                                            <span className="text-muted-foreground text-xs">
                                                                {image.ami_id} - {image.arquitectura}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Instance Type */}
                                <div className="grid gap-2">
                                    <Label htmlFor="solicitud-instance-type">Tipo de Instancia</Label>
                                    <Select
                                        value={createForm.instance_type_id}
                                        onValueChange={(value) => {
                                            const selectedType = instanceTypes.find((t) => t.id === Number(value));
                                            setCreateForm((prev) => ({
                                                ...prev,
                                                instance_type_id: value,
                                                ram_gb: selectedType ? Number(selectedType.memoria_gb) : prev.ram_gb,
                                            }));
                                        }}
                                    >
                                        <SelectTrigger id="solicitud-instance-type">
                                            <SelectValue placeholder="Seleccionar tipo de instancia" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {instanceTypes.map((type) => (
                                                <SelectItem key={type.id} value={String(type.id)}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono">{type.nombre}</span>
                                                        <span className="text-muted-foreground text-xs">
                                                            ({type.vcpus} vCPUs, {type.memoria_gb} GB RAM, ${Number(type.precio_hora).toFixed(4)}/hr) - {type.familia}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Storage */}
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="solicitud-ram">RAM (GB)</Label>
                                        <Input
                                            id="solicitud-ram"
                                            type="number"
                                            min={1}
                                            max={256}
                                            value={createForm.ram_gb}
                                            onChange={(e) =>
                                                setCreateForm((prev) => ({
                                                    ...prev,
                                                    ram_gb: Number(e.target.value),
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="solicitud-disco">Disco (GB)</Label>
                                        <Input
                                            id="solicitud-disco"
                                            type="number"
                                            min={8}
                                            max={16000}
                                            value={createForm.disco_gb}
                                            onChange={(e) =>
                                                setCreateForm((prev) => ({
                                                    ...prev,
                                                    disco_gb: Number(e.target.value),
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="solicitud-disco-tipo">Tipo de Disco</Label>
                                        <Select
                                            value={createForm.disco_tipo}
                                            onValueChange={(value: 'SSD' | 'HDD') =>
                                                setCreateForm((prev) => ({
                                                    ...prev,
                                                    disco_tipo: value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger id="solicitud-disco-tipo">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SSD">SSD (Recomendado)</SelectItem>
                                                <SelectItem value="HDD">HDD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Network */}
                                <div className="grid gap-2">
                                    <Label>Tipo de Conexion</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCreateForm((prev) => ({
                                                    ...prev,
                                                    conexion: 'publica',
                                                }))
                                            }
                                            className={`flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent ${
                                                createForm.conexion === 'publica'
                                                    ? 'border-primary bg-accent'
                                                    : ''
                                            }`}
                                        >
                                            <GlobeIcon className="size-5 text-green-600" />
                                            <div className="text-left">
                                                <p className="font-medium">Publica</p>
                                                <p className="text-muted-foreground text-xs">
                                                    Accesible desde Internet
                                                </p>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCreateForm((prev) => ({
                                                    ...prev,
                                                    conexion: 'privada',
                                                }))
                                            }
                                            className={`flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent ${
                                                createForm.conexion === 'privada'
                                                    ? 'border-primary bg-accent'
                                                    : ''
                                            }`}
                                        >
                                            <LockIcon className="size-5 text-amber-600" />
                                            <div className="text-left">
                                                <p className="font-medium">Privada</p>
                                                <p className="text-muted-foreground text-xs">
                                                    Requiere clave de acceso
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="grid gap-2">
                                    <Label htmlFor="solicitud-medio-pago">Medio de Pago</Label>
                                    <Select
                                        value={createForm.medio_pago}
                                        onValueChange={(value) =>
                                            setCreateForm((prev) => ({
                                                ...prev,
                                                medio_pago: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger id="solicitud-medio-pago">
                                            <SelectValue placeholder="Seleccionar medio de pago" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="transferencia_bancaria">Transferencia Bancaria</SelectItem>
                                            <SelectItem value="tarjeta_credito">Tarjeta de Credito</SelectItem>
                                            <SelectItem value="paypal">PayPal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Cost Preview */}
                                <CostPreview desglose={costPreview} />
                            </div>
                            <DialogFooter className="mt-4">
                                <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                {createForm.medio_pago === 'tarjeta_credito' ? (
                                    <Button
                                        onClick={handleContinueToPayment}
                                        disabled={!isStep1Valid}
                                    >
                                        Continuar con el Pago
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSubmitSolicitud}
                                        disabled={isSubmitting || !isStep1Valid}
                                    >
                                        {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>Pago con Tarjeta</DialogTitle>
                                <DialogDescription>
                                    Ingresa los datos de tu tarjeta para procesar el primer mes de servicio (${(costPreview.total * 30).toFixed(2)}).
                                </DialogDescription>
                            </DialogHeader>

                            {paymentError && (
                                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
                                    {paymentError}
                                </div>
                            )}

                            <div className="grid gap-4">
                                {/* PCI card number iframe */}
                                <div className="grid gap-2">
                                    <Label>Numero de Tarjeta</Label>
                                    <div
                                        id="mp-card-number"
                                        className="rounded-md border border-input bg-background"
                                        style={{ height: '40px', padding: '0 12px' }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* PCI expiration date iframe */}
                                    <div className="grid gap-2">
                                        <Label>Fecha de Vencimiento</Label>
                                        <div
                                            id="mp-expiration-date"
                                            className="rounded-md border border-input bg-background"
                                            style={{ height: '40px', padding: '0 12px' }}
                                        />
                                    </div>
                                    {/* PCI security code iframe */}
                                    <div className="grid gap-2">
                                        <Label>Codigo de Seguridad</Label>
                                        <div
                                            id="mp-security-code"
                                            className="rounded-md border border-input bg-background"
                                            style={{ height: '40px', padding: '0 12px' }}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="mp-cardholder">Nombre del Titular</Label>
                                    <Input
                                        id="mp-cardholder"
                                        value={mpForm.cardholderName}
                                        onChange={(e) => setMpForm((prev) => ({ ...prev, cardholderName: e.target.value }))}
                                        placeholder="Como aparece en la tarjeta"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="mp-identification-type">Tipo de Documento</Label>
                                        <Select
                                            value={mpForm.identificationType}
                                            onValueChange={(value) => setMpForm((prev) => ({ ...prev, identificationType: value }))}
                                        >
                                            <SelectTrigger id="mp-identification-type">
                                                <SelectValue placeholder="Tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {identificationTypes.map((type) => (
                                                    <SelectItem key={type.id} value={type.id}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="mp-identification-number">Numero de Documento</Label>
                                        <Input
                                            id="mp-identification-number"
                                            value={mpForm.identificationNumber}
                                            onChange={(e) => setMpForm((prev) => ({ ...prev, identificationNumber: e.target.value }))}
                                            placeholder="12345678"
                                        />
                                    </div>
                                </div>

                                {mpForm.paymentMethodId && (
                                    <p className="text-muted-foreground text-xs">
                                        Tarjeta detectada: <span className="font-medium capitalize">{mpForm.paymentMethodId}</span>
                                        {mpForm.issuerId && issuers.length > 0 && ` · ${issuers.find((i) => String(i.id) === mpForm.issuerId)?.name ?? ''}`}
                                    </p>
                                )}

                                {issuers.length > 1 && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="mp-issuer">Banco Emisor</Label>
                                        <Select
                                            value={mpForm.issuerId}
                                            onValueChange={(value) => setMpForm((prev) => ({ ...prev, issuerId: value }))}
                                        >
                                            <SelectTrigger id="mp-issuer">
                                                <SelectValue placeholder="Seleccionar banco" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {issuers.map((issuer) => (
                                                    <SelectItem key={issuer.id} value={String(issuer.id)}>
                                                        {issuer.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {installmentOptions.length > 0 && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="mp-installments">Cuotas</Label>
                                        <Select
                                            value={mpForm.installments}
                                            onValueChange={(value) => setMpForm((prev) => ({ ...prev, installments: value }))}
                                        >
                                            <SelectTrigger id="mp-installments">
                                                <SelectValue placeholder="Seleccionar cuotas" />
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
                            </div>

                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setStep(1)}>
                                    Volver
                                </Button>
                                <Button
                                    onClick={handlePayment}
                                    disabled={isSubmitting || !mpForm.cardholderName}
                                >
                                    {isSubmitting ? 'Procesando...' : `Pagar $${(costPreview.total * 30).toFixed(2)}`}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
