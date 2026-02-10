<?php

namespace App\Http\Requests\Client;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClientProfileUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $clientId = auth('client')->id();

        return [
            'nombre' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('clients', 'email')->ignore($clientId)],
            'tipo_documento' => ['required', Rule::in(['DNI', 'RUC'])],
            'numero_documento' => ['required', 'string', 'max:20', Rule::unique('clients', 'numero_documento')->ignore($clientId)],
        ];
    }

    /**
     * Get custom messages for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre es obligatorio.',
            'email.required' => 'El email es obligatorio.',
            'email.email' => 'El email debe ser una direccion valida.',
            'email.unique' => 'Este email ya esta registrado.',
            'tipo_documento.required' => 'El tipo de documento es obligatorio.',
            'tipo_documento.in' => 'El tipo de documento debe ser DNI o RUC.',
            'numero_documento.required' => 'El numero de documento es obligatorio.',
            'numero_documento.unique' => 'Este numero de documento ya esta registrado.',
        ];
    }
}
