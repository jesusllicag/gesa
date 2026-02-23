<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProcesarPagoTarjetaRequest extends FormRequest
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
            'nombre' => ['required', 'string', 'max:255'],
            'region_id' => ['required', 'exists:regions,id'],
            'operating_system_id' => ['required', 'exists:operating_systems,id'],
            'image_id' => ['required', 'exists:images,id'],
            'instance_type_id' => ['required', 'exists:instance_types,id'],
            'ram_gb' => ['required', 'integer', 'min:1', 'max:256'],
            'disco_gb' => ['required', 'integer', 'min:8', 'max:16000'],
            'disco_tipo' => ['required', Rule::in(['SSD', 'HDD'])],
            'conexion' => ['required', Rule::in(['publica', 'privada'])],
            'token' => ['required', 'string'],
            'installments' => ['required', 'integer', 'min:1'],
            'payment_method_id' => ['nullable', 'string'],
            'issuer_id' => ['nullable', 'integer'],
            'identification_type' => ['nullable', 'string'],
            'identification_number' => ['nullable', 'string'],
            'cardholder_name' => ['nullable', 'string'],
            'email' => ['nullable', 'email'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre del servidor es obligatorio.',
            'nombre.max' => 'El nombre no puede exceder 255 caracteres.',
            'region_id.required' => 'La region es obligatoria.',
            'region_id.exists' => 'La region seleccionada no existe.',
            'operating_system_id.required' => 'El sistema operativo es obligatorio.',
            'operating_system_id.exists' => 'El sistema operativo seleccionado no existe.',
            'image_id.required' => 'La imagen es obligatoria.',
            'image_id.exists' => 'La imagen seleccionada no existe.',
            'instance_type_id.required' => 'El tipo de instancia es obligatorio.',
            'instance_type_id.exists' => 'El tipo de instancia seleccionado no existe.',
            'ram_gb.required' => 'La cantidad de RAM es obligatoria.',
            'ram_gb.min' => 'La RAM debe ser al menos 1 GB.',
            'ram_gb.max' => 'La RAM no puede exceder 256 GB.',
            'disco_gb.required' => 'El tamano del disco es obligatorio.',
            'disco_gb.min' => 'El disco debe ser al menos 8 GB.',
            'disco_gb.max' => 'El disco no puede exceder 16 TB.',
            'disco_tipo.required' => 'El tipo de disco es obligatorio.',
            'disco_tipo.in' => 'El tipo de disco debe ser SSD o HDD.',
            'conexion.required' => 'El tipo de conexion es obligatorio.',
            'conexion.in' => 'El tipo de conexion debe ser publica o privada.',
            'token.required' => 'El token de la tarjeta es obligatorio.',
            'installments.required' => 'Las cuotas son obligatorias.',
            'installments.min' => 'Las cuotas deben ser al menos 1.',
            'payment_method_id.required' => 'El metodo de pago es obligatorio.',
        ];
    }
}
