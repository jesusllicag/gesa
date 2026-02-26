<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\PagarDeudaServidorRequest;
use App\Http\Requests\PagarMensualidadRequest;
use App\Models\PagoMensual;
use App\Models\Server;
use Illuminate\Http\RedirectResponse;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Exceptions\MPApiException;
use MercadoPago\MercadoPagoConfig;

class ClientServerController extends Controller
{
    /** Minimum billable active time in milliseconds (1 day). */
    private const MIN_BILLABLE_MS = 86_400_000;

    /** Maximum payable debt in days. */
    private const MAX_PAYABLE_DAYS = 30;

    public function start(Server $server): RedirectResponse
    {
        $client = auth('client')->user();

        abort_unless($server->client_id === $client->id, 404);
        abort_unless($server->estado === 'stopped', 403);

        $server->update([
            'estado' => 'running',
            'latest_release' => now(),
            'first_activated_at' => $server->first_activated_at ?? now(),
        ]);

        activity('servidores')
            ->performedOn($server)
            ->causedBy($client)
            ->log('Servidor iniciado por cliente');

        return back()->with('success', 'Servidor iniciado correctamente.');
    }

    public function stop(Server $server): RedirectResponse
    {
        $client = auth('client')->user();

        abort_unless($server->client_id === $client->id, 404);
        abort_unless($server->estado === 'running', 403);

        $elapsedMs = $server->latest_release
            ? (int) abs(now()->diffInMilliseconds($server->latest_release))
            : 0;

        $server->update([
            'estado' => 'stopped',
            'active_ms' => $server->active_ms + $elapsedMs,
            'latest_release' => null,
        ]);

        activity('servidores')
            ->performedOn($server)
            ->causedBy($client)
            ->log('Servidor detenido por cliente');

        return back()->with('success', 'Servidor detenido correctamente.');
    }

    public function pagarDeuda(PagarDeudaServidorRequest $request, Server $server): RedirectResponse
    {
        $client = auth('client')->user();

        abort_unless($server->client_id === $client->id, 404);

        $currentActiveMs = $server->active_ms;
        if ($server->latest_release) {
            $currentActiveMs += (int) now()->diffInMilliseconds($server->latest_release);
        }

        $pendingMs = max(0, $currentActiveMs - $server->billed_active_ms);

        if ($pendingMs < self::MIN_BILLABLE_MS) {
            return back()->withErrors(['payment' => 'No hay deuda pendiente suficiente (minimo 1 dia de uso activo).']);
        }

        $pendingDays = $pendingMs / 86_400_000;
        $daysToCharge = min($pendingDays, self::MAX_PAYABLE_DAYS);
        $transactionAmount = round($daysToCharge * (float) $server->costo_diario, 2);

        MercadoPagoConfig::setAccessToken(config('mercadopago.access_token'));

        if (app()->environment('local', 'testing')) {
            MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::LOCAL);
        }

        $validated = $request->validated();
        $mpClient = new PaymentClient;

        try {
            $paymentData = [
                'transaction_amount' => $transactionAmount,
                'token' => $validated['token'],
                'description' => 'Deuda servidor: '.$server->nombre.' ('.round($daysToCharge, 1).' dias)',
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

        $msToCredit = (int) round($daysToCharge * 86_400_000);

        $server->update([
            'billed_active_ms' => $server->billed_active_ms + $msToCredit,
        ]);

        PagoMensual::create([
            'server_id' => $server->id,
            'anio' => now()->year,
            'mes' => now()->month,
            'monto' => $transactionAmount,
            'estado' => 'pagado',
            'fecha_pago' => now(),
            'observaciones' => 'Pago de deuda por '.$client->nombre.' ('.round($daysToCharge, 2).' dias activos).',
        ]);

        return back()->with('success', 'Pago procesado correctamente. Se acreditaron '.round($daysToCharge, 1).' dias.');
    }

    public function pagarMensualidad(PagarMensualidadRequest $request, Server $server): RedirectResponse
    {
        $client = auth('client')->user();

        abort_unless($server->client_id === $client->id, 404);

        $transactionAmount = round((float) $server->costo_diario * 30, 2);
        $msMensualidad = 30 * 86_400_000;

        if ($request->medio_pago === 'tarjeta_credito') {
            MercadoPagoConfig::setAccessToken(config('mercadopago.access_token'));

            if (app()->environment('local', 'testing')) {
                MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::LOCAL);
            }

            $validated = $request->validated();
            $mpClient = new PaymentClient;

            try {
                $paymentData = [
                    'transaction_amount' => $transactionAmount,
                    'token' => $validated['token'],
                    'description' => 'Mensualidad servidor: '.$server->nombre.' (30 dias)',
                    'installments' => (int) $validated['installments'],
                    'payment_method_id' => $validated['payment_method_id'],
                    'payer' => ['email' => $client->email],
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

                return back()->withErrors(['payment' => $content['message'] ?? 'Error al procesar el pago.']);
            } catch (\Exception $e) {
                return back()->withErrors(['payment' => 'Error al conectar con MercadoPago: '.$e->getMessage()]);
            }

            $server->increment('billed_active_ms', $msMensualidad);

            PagoMensual::create([
                'server_id' => $server->id,
                'anio' => now()->year,
                'mes' => now()->month,
                'monto' => $transactionAmount,
                'estado' => 'pagado',
                'fecha_pago' => now(),
                'observaciones' => 'Mensualidad adelantada — pago con tarjeta de credito ('.$client->nombre.').',
            ]);

            return back()->with('success', 'Mensualidad pagada correctamente. Se acreditaron 30 dias.');
        }

        // Transferencia bancaria
        $existePendiente = $server->pagosMensuales()->where('estado', 'pendiente')->exists();

        if ($existePendiente) {
            return back()->withErrors(['payment' => 'Ya tienes un pago pendiente de confirmacion para este servidor.']);
        }

        PagoMensual::create([
            'server_id' => $server->id,
            'anio' => now()->year,
            'mes' => now()->month,
            'monto' => $transactionAmount,
            'estado' => 'pendiente',
            'fecha_pago' => null,
            'observaciones' => 'Mensualidad adelantada — pendiente de confirmacion por transferencia bancaria ('.$client->nombre.').',
        ]);

        return back()->with('success', 'Solicitud de mensualidad registrada. El equipo confirmara tu transferencia bancaria en breve.');
    }

    public function pagarTransferencia(Server $server): RedirectResponse
    {
        $client = auth('client')->user();

        abort_unless($server->client_id === $client->id, 404);

        $existePendiente = $server->pagosMensuales()->where('estado', 'pendiente')->exists();

        if ($existePendiente) {
            return back()->withErrors(['payment' => 'Ya tienes un pago pendiente de confirmacion para este servidor.']);
        }

        $currentActiveMs = $server->active_ms;
        if ($server->latest_release) {
            $currentActiveMs += (int) abs(now()->diffInMilliseconds($server->latest_release));
        }

        $pendingMs = max(0, $currentActiveMs - $server->billed_active_ms);

        if ($pendingMs < self::MIN_BILLABLE_MS) {
            return back()->withErrors(['payment' => 'No hay deuda pendiente suficiente (minimo 1 dia de uso activo).']);
        }

        $pendingDays = $pendingMs / 86_400_000;
        $daysToCharge = min($pendingDays, self::MAX_PAYABLE_DAYS);
        $transactionAmount = round($daysToCharge * (float) $server->costo_diario, 2);

        PagoMensual::create([
            'server_id' => $server->id,
            'anio' => now()->year,
            'mes' => now()->month,
            'monto' => $transactionAmount,
            'estado' => 'pendiente',
            'fecha_pago' => null,
            'observaciones' => 'Pago por transferencia bancaria — pendiente de confirmacion ('.round($daysToCharge, 2).' dias activos).',
        ]);

        return back()->with('success', 'Solicitud de pago registrada. El equipo confirmara tu transferencia bancaria en breve.');
    }
}
