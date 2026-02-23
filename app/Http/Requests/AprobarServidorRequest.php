<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AprobarServidorRequest extends FormRequest
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
            'medio_pago' => ['required', Rule::in(['transferencia_bancaria', 'tarjeta_credito'])],
            'token' => ['required_if:medio_pago,tarjeta_credito', 'nullable', 'string'],
            'installments' => ['required_if:medio_pago,tarjeta_credito', 'nullable', 'integer', 'min:1'],
            'payment_method_id' => ['nullable', 'string'],
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
            'medio_pago.required' => 'Debes seleccionar un medio de pago.',
            'medio_pago.in' => 'El medio de pago seleccionado no es valido.',
            'token.required_if' => 'El token de tarjeta es obligatorio para pago con tarjeta.',
            'installments.required_if' => 'Las cuotas son obligatorias para pago con tarjeta.',
        ];
    }
}
