<?php

namespace App\Http\Requests\Review;

use Illuminate\Foundation\Http\FormRequest;

class ReplyReviewRequest extends FormRequest
{
    /**
     * Real check ("do you own this property") is ReviewPolicy::reply,
     * run explicitly in the controller.
     */
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
            'owner_reply' => ['required', 'string', 'max:2000'],
        ];
    }
}
