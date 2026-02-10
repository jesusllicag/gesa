<?php

namespace App\Http\Requests\Client;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ClientPasswordUpdateRequest extends FormRequest
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
            'current_password' => ['required', 'string', 'current_password:client'],
            'password' => ['required', 'string', Password::defaults(), 'confirmed'],
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
            'current_password.required' => 'La contrasena actual es obligatoria.',
            'current_password.current_password' => 'La contrasena actual es incorrecta.',
            'password.required' => 'La nueva contrasena es obligatoria.',
            'password.confirmed' => 'Las contrasenas no coinciden.',
        ];
    }
}
