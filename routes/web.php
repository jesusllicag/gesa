<?php

use App\Http\Controllers\Auth\ForcePasswordChangeController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ServerController;
use App\Http\Controllers\Settings\PolicyController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

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
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

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

    // Servers
    Route::get('servers', [ServerController::class, 'index'])->name('servers.index');
    Route::post('servers', [ServerController::class, 'store'])->name('servers.store');
    Route::put('servers/{server}', [ServerController::class, 'update'])->name('servers.update');
    Route::post('servers/{server}/start', [ServerController::class, 'start'])->name('servers.start');
    Route::post('servers/{server}/stop', [ServerController::class, 'stop'])->name('servers.stop');
    Route::delete('servers/{server}', [ServerController::class, 'destroy'])->name('servers.destroy');
});

require __DIR__.'/settings.php';
