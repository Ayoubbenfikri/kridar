<?php

namespace App\Http\Requests\Messaging;

use Illuminate\Foundation\Http\FormRequest;

/**
 * POST /conversations/{conversation}/messages — a reply in an existing
 * thread. Membership is checked by ConversationPolicy::reply().
 */
class StoreMessageRequest extends FormRequest
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
            'body.required' => 'Write a message before sending.',
            'body.max' => 'A message cannot exceed 2000 characters.',
        ];
    }
}
