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
 * Since Phase R2, the listing can be a property OR a roommate post —
 * exactly one of property_id / roommate_listing_id must be sent.
 * required_without makes each one mandatory when the other is absent;
 * prohibits stops both being sent together.
 *
 * The state rules (listing published, not your own) are NOT here — they
 * need the actual Property/RoommateListing row and live in
 * MessagingService::startOrContinue() / startOrContinueRoommate().
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
            'property_id' => [
                'nullable',
                'required_without:roommate_listing_id',
                'prohibits:roommate_listing_id',
                'integer',
                'exists:properties,id',
            ],
            'roommate_listing_id' => [
                'nullable',
                'required_without:property_id',
                'prohibits:property_id',
                'integer',
                'exists:roommate_listings,id',
            ],
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
            'property_id.required_without' => 'Tell us which listing this is about.',
            'roommate_listing_id.required_without' => 'Tell us which listing this is about.',
            'property_id.prohibits' => 'A message can only be about one listing at a time.',
            'body.required' => 'Write a message before sending.',
            'body.max' => 'A message cannot exceed 2000 characters.',
        ];
    }
}
