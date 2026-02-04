<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ForcePasswordChangeController extends Controller
{
    /**
     * Show the force password change form.
     */
    public function show(): Response
    {
        return Inertia::render('auth/force-password-change');
    }

    /**
     * Handle the force password change request.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string', 'current_password'],
            'password' => ['required', 'string', Password::defaults(), 'confirmed'],
        ], [
            'current_password.required' => 'La contrasena actual es obligatoria.',
            'current_password.current_password' => 'La contrasena actual es incorrecta.',
            'password.required' => 'La nueva contrasena es obligatoria.',
            'password.confirmed' => 'Las contrasenas no coinciden.',
        ]);

        $request->user()->update([
            'password' => $validated['password'],
            'must_change_password' => false,
        ]);

        return redirect()->route('dashboard')->with('success', 'Contrasena actualizada correctamente.');
    }
}
