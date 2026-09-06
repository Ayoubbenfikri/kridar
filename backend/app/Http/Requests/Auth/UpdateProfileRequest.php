<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Any authenticated user can update their own profile - the route
     * itself is already behind auth:sanctum, there's no per-resource
     * ownership check needed here.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Email is deliberately NOT editable here - changing it would need
     * to re-trigger verification, which is a bigger decision than a
     * simple profile edit. Out of scope for now.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
        ];
    }
}
