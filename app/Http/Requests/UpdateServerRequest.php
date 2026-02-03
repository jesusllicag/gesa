<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServerRequest extends FormRequest
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
        $server = $this->route('server');

        return [
            'ram_gb' => ['required', 'integer', 'min:'.$server->ram_gb, 'max:256'],
            'disco_gb' => ['required', 'integer', 'min:'.$server->disco_gb, 'max:16000'],
            'conexion' => ['required', Rule::in(['publica', 'privada'])],
        ];
    }

    /**
     * Get custom messages for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $server = $this->route('server');

        return [
            'ram_gb.required' => 'La cantidad de RAM es obligatoria.',
            'ram_gb.min' => 'La RAM no puede ser menor a '.$server->ram_gb.' GB (valor actual).',
            'ram_gb.max' => 'La RAM no puede exceder 256 GB.',
            'disco_gb.required' => 'El tamaño del disco es obligatorio.',
            'disco_gb.min' => 'El disco no puede ser menor a '.$server->disco_gb.' GB (valor actual).',
            'disco_gb.max' => 'El disco no puede exceder 16 TB.',
            'conexion.required' => 'El tipo de conexión es obligatorio.',
            'conexion.in' => 'El tipo de conexión debe ser pública o privada.',
        ];
    }
}
