<?php

namespace App\Http\Requests\RoommateListing;

use App\Models\RoommateListing;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Same shape as StorePropertyImageRequest: only the poster or an admin
 * may add images, up to 10 total, checked against what already exists.
 */
class StoreRoommateListingImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var RoommateListing|null $roommateListing */
        $roommateListing = $this->route('roommate_listing');

        return $roommateListing !== null && $this->user()?->can('update', $roommateListing);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'images' => ['required', 'array', 'min:1', 'max:10'],
            'images.*' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'], // 5MB, in kilobytes
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (ValidatorContract $validator): void {
                /** @var RoommateListing|null $roommateListing */
                $roommateListing = $this->route('roommate_listing');

                if ($roommateListing === null) {
                    return;
                }

                $existing = $roommateListing->images()->count();
                $incoming = count($this->file('images', []));

                if ($existing + $incoming > 10) {
                    $remaining = max(0, 10 - $existing);
                    $validator->errors()->add(
                        'images',
                        "This post already has {$existing} image(s); you can add at most {$remaining} more (10 total)."
                    );
                }
            },
        ];
    }
}
