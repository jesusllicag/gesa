<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreActivoRequest extends FormRequest
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
        return [
            'client_id' => ['required', 'exists:clients,id'],
            'server_id' => ['required', 'exists:servers,id'],
            'hostname' => ['nullable', 'string', 'max:255'],
            'entorno' => ['required', Rule::in(['DEV', 'STG', 'QAS', 'PROD'])],
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
            'client_id.required' => 'El cliente es obligatorio.',
            'client_id.exists' => 'El cliente seleccionado no existe.',
            'server_id.required' => 'El servidor es obligatorio.',
            'server_id.exists' => 'El servidor seleccionado no existe.',
            'hostname.max' => 'El hostname no puede tener mas de 255 caracteres.',
            'entorno.required' => 'El entorno es obligatorio.',
            'entorno.in' => 'El entorno debe ser DEV, STG, QAS o PROD.',
        ];
    }
}
