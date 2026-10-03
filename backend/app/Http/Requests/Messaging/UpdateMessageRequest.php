<?php

namespace App\Http\Requests\Messaging;

use Illuminate\Foundation\Http\FormRequest;

/**
 * PATCH /conversations/{conversation}/messages/{message} — edit your own
 * message's text. Ownership is checked by MessagePolicy::update(), not here.
 */
class UpdateMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:1', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'body.required' => 'Write a message before saving.',
            'body.max' => 'A message cannot exceed 2000 characters.',
        ];
    }
}
