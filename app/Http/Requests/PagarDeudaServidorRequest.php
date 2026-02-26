<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PagarDeudaServidorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'token' => ['required', 'string'],
            'installments' => ['required', 'integer', 'min:1'],
            'payment_method_id' => ['required', 'string'],
            'issuer_id' => ['nullable', 'integer'],
            'identification_type' => ['nullable', 'string'],
            'identification_number' => ['nullable', 'string'],
            'cardholder_name' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'token.required' => 'El token de tarjeta es obligatorio.',
            'installments.required' => 'Las cuotas son obligatorias.',
            'payment_method_id.required' => 'El metodo de pago es obligatorio.',
        ];
    }
}
