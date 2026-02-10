<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\ClientPasswordUpdateRequest;
use Illuminate\Http\RedirectResponse;

class ClientPasswordController extends Controller
{
    /**
     * Update the client password.
     */
    public function update(ClientPasswordUpdateRequest $request): RedirectResponse
    {
        auth('client')->user()->update([
            'password' => $request->validated('password'),
        ]);

        return back()->with('success', 'Contrasena actualizada correctamente.');
    }
}
