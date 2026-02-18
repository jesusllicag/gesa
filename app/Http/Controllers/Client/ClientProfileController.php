<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\ClientProfileUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ClientProfileController extends Controller
{
    /**
     * Show the client profile edit page.
     */
    public function edit(): Response
    {
        $client = auth('client')->user();

        return Inertia::render('client/profile', [
            'client' => $client->only('id', 'nombre', 'email', 'tipo_documento', 'numero_documento'),
        ]);
    }

    /**
     * Update the client profile.
     */
    public function update(ClientProfileUpdateRequest $request): RedirectResponse
    {
        auth('client')->user()->update($request->validated());

        return back()->with('success', 'Perfil actualizado correctamente.');
    }
}
