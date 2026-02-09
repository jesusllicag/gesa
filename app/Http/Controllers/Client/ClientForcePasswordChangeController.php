<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ClientForcePasswordChangeController extends Controller
{
    /**
     * Show the force password change form.
     */
    public function show(): Response
    {
        return Inertia::render('client/force-password-change');
    }

    /**
     * Handle the force password change request.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string', 'current_password:client'],
            'password' => ['required', 'string', Password::defaults(), 'confirmed'],
        ], [
            'current_password.required' => 'La contrasena actual es obligatoria.',
            'current_password.current_password' => 'La contrasena actual es incorrecta.',
            'password.required' => 'La nueva contrasena es obligatoria.',
            'password.confirmed' => 'Las contrasenas no coinciden.',
        ]);

        auth('client')->user()->update([
            'password' => $validated['password'],
            'must_change_password' => false,
        ]);

        return redirect()->route('client.dashboard')->with('success', 'Contrasena actualizada correctamente.');
    }
}
