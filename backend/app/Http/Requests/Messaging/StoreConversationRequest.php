<?php

namespace App\Http\Requests\Messaging;

use Illuminate\Foundation\Http\FormRequest;

/**
 * POST /conversations — open (or continue) the thread about a listing
 * and post a message in one call.
 *
 * One call rather than "create thread, then send message" because an
 * empty thread is not a thing anyone wants: it would show up in the
 * other person's inbox with nothing to read.
 *
 * The state rules (listing published, not your own) are NOT here — they
 * need the Property row and live in MessagingService::startOrContinue().
 */
class StoreConversationRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Being logged in and verified is enforced by route middleware.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'property_id' => ['required', 'integer', 'exists:properties,id'],
            // 2000 characters is a long message and a short essay. The
            // cap exists so one request cannot dump unbounded text into
            // the database.
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
