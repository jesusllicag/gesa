<?php

use App\Http\Controllers\ActivoController;
use App\Http\Controllers\Auth\ForcePasswordChangeController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Client\ClientAuthController;
use App\Http\Controllers\Client\ClientDashboardController;
use App\Http\Controllers\Client\ClientForcePasswordChangeController;
use App\Http\Controllers\Client\ClientPasswordController;
use App\Http\Controllers\Client\ClientProfileController;
use App\Http\Controllers\Client\ClientServerApprovalController;
use App\Http\Controllers\Client\ClientServerController;
use App\Http\Controllers\Client\ClientServerPdfController;
use App\Http\Controllers\Client\ClientSolicitudController;
use App\Http\Controllers\Client\PagoTarjetaController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ServerController;
use App\Http\Controllers\Settings\PolicyController;
use App\Http\Controllers\SolicitudServidorController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::prefix('admin')->group(function () {
    // Email verification - logs in user automatically after verification
    Route::get('email/verify/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::middleware(['auth', 'verified'])->group(function () {
        Route::get('password/force-change', [ForcePasswordChangeController::class, 'show'])
            ->name('password.force-change');
        Route::put('password/force-change', [ForcePasswordChangeController::class, 'update'])
            ->name('password.force-change.update');
    });

    Route::middleware(['auth', 'verified', 'password.changed'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Users
        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::post('users', [UserController::class, 'store'])->name('users.store');
        Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        // Policies
        Route::get('policies', [PolicyController::class, 'index'])->name('policies.index');
        Route::post('policies', [PolicyController::class, 'store'])->name('policies.store');
        Route::put('policies/{role}', [PolicyController::class, 'update'])->name('policies.update');
        Route::delete('policies/{role}', [PolicyController::class, 'destroy'])->name('policies.destroy');

        // Clients
        Route::get('clients', [ClientController::class, 'index'])->name('clients.index');
        Route::post('clients', [ClientController::class, 'store'])->name('clients.store');
        Route::put('clients/{client}', [ClientController::class, 'update'])->name('clients.update');
        Route::delete('clients/{client}', [ClientController::class, 'destroy'])->name('clients.destroy');

        // Activos
        Route::get('activos', [ActivoController::class, 'index'])->name('activos.index');
        Route::post('activos', [ActivoController::class, 'store'])->name('activos.store');
        Route::get('activos/{server}', [ActivoController::class, 'show'])->name('activos.show');
        Route::put('activos/{server}', [ActivoController::class, 'update'])->name('activos.update');
        Route::post('activos/{server}/dar-de-baja', [ActivoController::class, 'darDeBaja'])->name('activos.dar-de-baja');
        Route::get('activos/{server}/pdf', [ActivoController::class, 'pdfActivo'])->name('activos.pdf');
        Route::post('activos/{server}/pagos/{pago}/validar', [ActivoController::class, 'validarPago'])->name('activos.pagos.validar');

        // Servers
        Route::get('servers', [ServerController::class, 'index'])->name('servers.index');
        Route::post('servers', [ServerController::class, 'store'])->name('servers.store');
        Route::put('servers/{server}', [ServerController::class, 'update'])->name('servers.update');
        Route::post('servers/{server}/start', [ServerController::class, 'start'])->name('servers.start');
        Route::post('servers/{server}/stop', [ServerController::class, 'stop'])->name('servers.stop');
        Route::delete('servers/{server}', [ServerController::class, 'destroy'])->name('servers.destroy');

        // Solicitudes
        Route::get('solicitudes', [SolicitudServidorController::class, 'index'])->name('solicitudes.index');
        Route::post('solicitudes/{solicitud_servidor}/approve', [SolicitudServidorController::class, 'approve'])->name('solicitudes.approve');
        Route::post('solicitudes/{solicitud_servidor}/reject', [SolicitudServidorController::class, 'reject'])->name('solicitudes.reject');
    });
});

// Client Portal
Route::prefix('client')->group(function () {
    Route::middleware('guest:client')->group(function () {
        Route::get('login', [ClientAuthController::class, 'showLogin'])->name('client.login');
        Route::post('login', [ClientAuthController::class, 'login'])->name('client.login.store');
    });

    Route::middleware('auth:client')->group(function () {
        Route::post('logout', [ClientAuthController::class, 'logout'])->name('client.logout');

        Route::get('password/force-change', [ClientForcePasswordChangeController::class, 'show'])
            ->name('client.password.force-change');
        Route::put('password/force-change', [ClientForcePasswordChangeController::class, 'update'])
            ->name('client.password.force-change.update');

        Route::middleware('client.password.changed')->group(function () {
            Route::get('dashboard', [ClientDashboardController::class, 'index'])->name('client.dashboard');
            Route::post('solicitudes', [ClientSolicitudController::class, 'store'])->name('client.solicitudes.store');
            Route::post('pagos/tarjeta', [PagoTarjetaController::class, 'store'])->name('client.pagos.tarjeta');

            Route::get('profile', [ClientProfileController::class, 'edit'])->name('client.profile.edit');
            Route::put('profile', [ClientProfileController::class, 'update'])->name('client.profile.update');
            Route::put('password', [ClientPasswordController::class, 'update'])->name('client.password.update');

            // Server PDF download
            Route::get('servers/{server}/pdf', [ClientServerPdfController::class, 'download'])->name('client.servers.pdf');

            // Server start/stop/debt payment
            Route::post('servers/{server}/start', [ClientServerController::class, 'start'])->name('client.servers.start');
            Route::post('servers/{server}/stop', [ClientServerController::class, 'stop'])->name('client.servers.stop');
            Route::post('servers/{server}/pagar-deuda', [ClientServerController::class, 'pagarDeuda'])->name('client.servers.pagar-deuda');
            Route::post('servers/{server}/pagar-transferencia', [ClientServerController::class, 'pagarTransferencia'])->name('client.servers.pagar-transferencia');
            Route::post('servers/{server}/pagar-mensualidad', [ClientServerController::class, 'pagarMensualidad'])->name('client.servers.pagar-mensualidad');

            // Server approval
            Route::get('servers/{token}/review', [ClientServerApprovalController::class, 'show'])->name('client.servers.review');
            Route::post('servers/{token}/approve', [ClientServerApprovalController::class, 'approve'])->name('client.servers.approve');
            Route::post('servers/{token}/reject', [ClientServerApprovalController::class, 'reject'])->name('client.servers.reject');
        });
    });
});

require __DIR__.'/settings.php';
