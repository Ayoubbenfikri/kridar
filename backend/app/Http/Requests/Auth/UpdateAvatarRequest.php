<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

/**
 * POST /auth/avatar — upload or replace your own profile photo.
 */
class UpdateAvatarRequest extends FormRequest
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
            'avatar' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'], // 2MB, in kilobytes
        ];
    }

    /**
     * Plain English here, same as every other FormRequest's messages() in
     * this app (StoreMessageRequest, UpdateMessageRequest...) — validation
     * messages are not on the lang/{fr,en,ary} i18n system yet (see the
     * note at the top of lang/en/messages.php), only AuthController's own
     * __() strings are.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'avatar.required' => 'Choose a photo.',
            'avatar.image' => 'The file must be an image.',
            'avatar.mimes' => 'Accepted formats: JPEG, PNG, WebP.',
            'avatar.max' => 'The image must not be larger than 2MB.',
        ];
    }
}
