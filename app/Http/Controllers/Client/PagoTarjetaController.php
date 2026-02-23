<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProcesarPagoTarjetaRequest;
use App\Models\InstanceType;
use App\Models\SolicitudServidor;
use App\Services\CostCalculatorService;
use Illuminate\Http\RedirectResponse;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Exceptions\MPApiException;
use MercadoPago\MercadoPagoConfig;

class PagoTarjetaController extends Controller
{
    public function __construct(private CostCalculatorService $costCalculator) {}

    public function store(ProcesarPagoTarjetaRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $instanceType = InstanceType::findOrFail($validated['instance_type_id']);
        $costoDiario = $this->costCalculator->calcularCostoDiario(
            $instanceType,
            $validated['ram_gb'],
            $validated['disco_gb'],
            $validated['disco_tipo'],
            $validated['conexion']
        );

        $transactionAmount = round($costoDiario * 30, 2);

        MercadoPagoConfig::setAccessToken(config('mercadopago.access_token'));

        if (app()->environment('local', 'testing')) {
            MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::LOCAL);
        }

        $client = new PaymentClient;

        try {
            $paymentData = [
                'transaction_amount' => $transactionAmount,
                'token' => $validated['token'],
                'description' => 'Servidor: '.$validated['nombre'].' (primer mes)',
                'installments' => $validated['installments'],
                'payment_method_id' => $validated['payment_method_id'],
                'payer' => [
                    'email' => $validated['email'] ?? auth('client')->user()->email,
                ],
            ];

            if (! empty($validated['issuer_id'])) {
                $paymentData['issuer_id'] = $validated['issuer_id'];
            }

            if (! empty($validated['identification_type']) && ! empty($validated['identification_number'])) {
                $paymentData['payer']['identification'] = [
                    'type' => $validated['identification_type'],
                    'number' => $validated['identification_number'],
                ];
            }

            $payment = $client->create($paymentData);

            if (in_array($payment->status, ['approved', 'in_process'])) {
                SolicitudServidor::create([
                    'client_id' => auth('client')->id(),
                    'nombre' => $validated['nombre'],
                    'region_id' => $validated['region_id'],
                    'operating_system_id' => $validated['operating_system_id'],
                    'image_id' => $validated['image_id'],
                    'instance_type_id' => $validated['instance_type_id'],
                    'ram_gb' => $validated['ram_gb'],
                    'disco_gb' => $validated['disco_gb'],
                    'disco_tipo' => $validated['disco_tipo'],
                    'conexion' => $validated['conexion'],
                    'medio_pago' => 'tarjeta_credito',
                    'costo_diario_estimado' => $costoDiario,
                    'estado' => 'pendiente',
                    'mp_payment_id' => (string) $payment->id,
                    'mp_payment_status' => $payment->status,
                ]);

                return back()->with('success', 'Pago procesado correctamente. Tu solicitud ha sido enviada y sera revisada por un administrador.');
            }

            return back()->withErrors(['payment' => 'El pago fue rechazado: '.($payment->status_detail ?? $payment->status)]);
        } catch (MPApiException $e) {
            $content = $e->getApiResponse()->getContent();
            $message = $content['message'] ?? 'Error al procesar el pago.';

            return back()->withErrors(['payment' => $message]);
        } catch (\Exception $e) {
            return back()->withErrors(['payment' => 'Error al conectar con MercadoPago: '.$e->getMessage()]);
        }
    }
}
