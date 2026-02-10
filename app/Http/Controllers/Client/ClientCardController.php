<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreClientCardRequest;
use App\Models\TarjetaCliente;
use App\Services\MercadoPagoService;
use Illuminate\Http\RedirectResponse;

class ClientCardController extends Controller
{
    public function __construct(public MercadoPagoService $mercadoPago) {}

    /**
     * Store a new card for the authenticated client.
     */
    public function store(StoreClientCardRequest $request): RedirectResponse
    {
        $client = auth('client')->user();

        $customerId = $this->mercadoPago->getOrCreateCustomer($client);
        $cardData = $this->mercadoPago->addCard($customerId, $request->validated('token'));

        $client->tarjetas()->create($cardData);

        return back()->with('success', 'Tarjeta agregada correctamente.');
    }

    /**
     * Delete a card from the authenticated client.
     */
    public function destroy(TarjetaCliente $tarjeta): RedirectResponse
    {
        $client = auth('client')->user();

        if ($tarjeta->client_id !== $client->id) {
            abort(403);
        }

        $this->mercadoPago->deleteCard($client->mp_customer_id, $tarjeta->mp_card_id);

        $tarjeta->delete();

        return back()->with('success', 'Tarjeta eliminada correctamente.');
    }
}
