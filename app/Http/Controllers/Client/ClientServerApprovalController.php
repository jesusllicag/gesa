<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\AprobarServidorRequest;
use App\Models\PagoMensual;
use App\Models\Server;
use App\Notifications\ServidorAprobadoClienteNotification;
use App\Notifications\ServidorRechazadoClienteNotification;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Exceptions\MPApiException;
use MercadoPago\MercadoPagoConfig;

class ClientServerApprovalController extends Controller
{
    public function show(string $token): Response|RedirectResponse
    {
        $client = auth('client')->user();

        $server = Server::with([
            'region:id,codigo,nombre',
            'operatingSystem:id,nombre,logo',
            'image:id,nombre,version,arquitectura',
            'instanceType:id,nombre,familia,vcpus,procesador,memoria_gb,rendimiento_red,precio_hora',
        ])
            ->where('token_aprobacion', $token)
            ->where('client_id', $client->id)
            ->where('estado', 'pendiente_aprobacion')
            ->firstOrFail();

        return Inertia::render('client/server-approval', [
            'server' => $server,
            'mercadopago_public_key' => config('mercadopago.public_key'),
        ]);
    }

    public function approve(AprobarServidorRequest $request, string $token): RedirectResponse
    {
        $client = auth('client')->user();

        $server = Server::with([
            'region:id,codigo,nombre',
            'operatingSystem:id,nombre,logo',
            'instanceType:id,nombre,vcpus,memoria_gb',
        ])
            ->where('token_aprobacion', $token)
            ->where('client_id', $client->id)
            ->where('estado', 'pendiente_aprobacion')
            ->firstOrFail();

        $validated = $request->validated();

        if ($validated['medio_pago'] === 'tarjeta_credito') {
            $transactionAmount = round((float) $server->costo_diario * 30, 2);

            MercadoPagoConfig::setAccessToken(config('mercadopago.access_token'));

            if (app()->environment('local', 'testing')) {
                MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::LOCAL);
            }

            $mpClient = new PaymentClient;

            try {
                $paymentData = [
                    'transaction_amount' => $transactionAmount,
                    'token' => $validated['token'],
                    'description' => 'Servidor: '.$server->nombre.' (primer mes)',
                    'installments' => (int) $validated['installments'],
                    'payment_method_id' => $validated['payment_method_id'],
                    'payer' => [
                        'email' => $client->email,
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

                $payment = $mpClient->create($paymentData);

                if (! in_array($payment->status, ['approved', 'in_process'])) {
                    return back()->withErrors(['payment' => 'El pago fue rechazado: '.($payment->status_detail ?? $payment->status)]);
                }
            } catch (MPApiException $e) {
                $content = $e->getApiResponse()->getContent();
                $message = $content['message'] ?? 'Error al procesar el pago.';

                return back()->withErrors(['payment' => $message]);
            } catch (\Exception $e) {
                return back()->withErrors(['payment' => 'Error al conectar con MercadoPago: '.$e->getMessage()]);
            }
        }

        $monto = round((float) $server->costo_diario * 30, 2);
        $esTarjeta = $validated['medio_pago'] === 'tarjeta_credito';

        $server->update([
            'estado' => 'pending',
            'token_aprobacion' => null,
            'billed_active_ms' => $esTarjeta ? 30 * 24 * 60 * 60 * 1000 : 0,
        ]);

        PagoMensual::create([
            'server_id' => $server->id,
            'anio' => now()->year,
            'mes' => now()->month,
            'monto' => $monto,
            'estado' => $esTarjeta ? 'pagado' : 'pendiente',
            'fecha_pago' => $esTarjeta ? now() : null,
            'observaciones' => 'Primer mes — '.($esTarjeta ? 'pago con tarjeta de credito.' : 'pendiente de confirmacion por transferencia bancaria.'),
        ]);

        activity('servidores')
            ->performedOn($server)
            ->causedBy($client)
            ->log('Servidor aprobado por cliente');

        $client->notify(new ServidorAprobadoClienteNotification($server));

        return redirect()->route('client.dashboard')->with('success', 'Servidor aprobado correctamente. El equipo lo activara en breve.');
    }

    public function reject(string $token): RedirectResponse
    {
        $client = auth('client')->user();

        $server = Server::where('token_aprobacion', $token)
            ->where('client_id', $client->id)
            ->where('estado', 'pendiente_aprobacion')
            ->firstOrFail();

        $serverNombre = $server->nombre;

        $server->update([
            'estado' => 'terminated',
            'token_aprobacion' => null,
        ]);

        activity('servidores')
            ->performedOn($server)
            ->causedBy($client)
            ->log('Servidor rechazado por cliente');

        $client->notify(new ServidorRechazadoClienteNotification($server));

        $server->delete();

        return redirect()->route('client.dashboard')->with('success', 'Has rechazado el servidor "'.$serverNombre.'". Hemos notificado al equipo.');
    }
}
