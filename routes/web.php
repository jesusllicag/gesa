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
    Route::get('policies', [PolicyController::class, 'edit'])->name('policies.index');
});

require __DIR__.'/settings.php';
