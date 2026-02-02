<?php

use App\Http\Controllers\Settings\PolicyController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    Route::get('users', function () {
        return Inertia::render('users/index');
    })->name('users.index');
    Route::get('policies', [PolicyController::class, 'index'])->name('policies.index');
    Route::post('policies', [PolicyController::class, 'store'])->name('policies.store');
    Route::put('policies/{role}', [PolicyController::class, 'update'])->name('policies.update');
    Route::delete('policies/{role}', [PolicyController::class, 'destroy'])->name('policies.destroy');
});

require __DIR__.'/settings.php';
