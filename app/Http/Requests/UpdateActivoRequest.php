<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateActivoRequest extends FormRequest
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
            'hostname.max' => 'El hostname no puede tener mas de 255 caracteres.',
            'entorno.required' => 'El entorno es obligatorio.',
            'entorno.in' => 'El entorno debe ser DEV, STG, QAS o PROD.',
        ];
    }
}
