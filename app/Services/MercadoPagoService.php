<?php

namespace App\Services;

use App\Models\Client;
use MercadoPago\Client\Customer\CustomerCardClient;
use MercadoPago\Client\Customer\CustomerClient;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Resources\CustomerCard;

class MercadoPagoService
{
    public function __construct()
    {
        $token = config('services.mercadopago.access_token');

        if ($token) {
            MercadoPagoConfig::setAccessToken($token);
        }
    }

    /**
     * Get or create a MercadoPago customer for the given client.
     */
    public function getOrCreateCustomer(Client $client): string
    {
        if ($client->mp_customer_id) {
            return $client->mp_customer_id;
        }

        $customerClient = new CustomerClient;
        $customer = $customerClient->create(['email' => $client->email]);

        $client->update(['mp_customer_id' => $customer->id]);

        return $customer->id;
    }

    /**
     * Add a card to a MercadoPago customer using a token.
     *
     * @return array{mp_card_id: string, last_four_digits: string, first_six_digits: string, brand: string, expiration_month: int, expiration_year: int, cardholder_name: string, payment_type: string}
     */
    public function addCard(string $customerId, string $token): array
    {
        $cardClient = new CustomerCardClient;
        $card = $cardClient->create($customerId, ['token' => $token]);

        return $this->mapCardData($card);
    }

    /**
     * Delete a card from a MercadoPago customer.
     */
    public function deleteCard(string $customerId, string $cardId): void
    {
        $cardClient = new CustomerCardClient;
        $cardClient->delete($customerId, $cardId);
    }

    /**
     * Map a CustomerCard resource to a local data array.
     *
     * @return array{mp_card_id: string, last_four_digits: string, first_six_digits: string, brand: string, expiration_month: int, expiration_year: int, cardholder_name: string, payment_type: string}
     */
    private function mapCardData(CustomerCard $card): array
    {
        return [
            'mp_card_id' => $card->id,
            'last_four_digits' => $card->last_four_digits,
            'first_six_digits' => $card->first_six_digits,
            'brand' => $card->payment_method->id ?? 'unknown',
            'expiration_month' => $card->expiration_month,
            'expiration_year' => $card->expiration_year,
            'cardholder_name' => $card->cardholder->name ?? 'N/A',
            'payment_type' => $card->payment_method->type ?? 'credit_card',
        ];
    }
}
