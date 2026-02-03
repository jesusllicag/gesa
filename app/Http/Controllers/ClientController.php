<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(): Response
    {
        $search = request()->input('search', '');

        $clients = Client::with('creator:id,name')
            ->select('id', 'nombre', 'email', 'tipo_documento', 'numero_documento', 'created_by', 'created_at')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nombre', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('numero_documento', 'like', "%{$search}%");
                });
            })
            ->orderBy('nombre')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('clients/index', [
            'clients' => $clients,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(StoreClientRequest $request): RedirectResponse
    {
        Client::create([
            ...$request->validated(),
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', 'Cliente creado correctamente.');
    }

    public function update(UpdateClientRequest $request, Client $client): RedirectResponse
    {
        $client->update($request->validated());

        return back()->with('success', 'Cliente actualizado correctamente.');
    }

    public function destroy(Client $client): RedirectResponse
    {
        $client->delete();

        return back()->with('success', 'Cliente eliminado correctamente.');
    }
}
