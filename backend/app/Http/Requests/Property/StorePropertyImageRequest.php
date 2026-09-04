<?php

namespace App\Http\Requests\Property;

use App\Models\Property;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

class StorePropertyImageRequest extends FormRequest
{
    /**
     * Only the property's owner or an admin may add images to it.
     */
    public function authorize(): bool
    {
        /** @var Property|null $property */
        $property = $this->route('property');

        return $property !== null && $this->user()?->can('update', $property);
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
     * Cross-check against images the property already has in the database -
     * the "max:10" rule above only limits this single request's array, it
     * can't see existing rows.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (ValidatorContract $validator): void {
                /** @var Property|null $property */
                $property = $this->route('property');

                if ($property === null) {
                    return;
                }

                $existing = $property->images()->count();
                $incoming = count($this->file('images', []));

                if ($existing + $incoming > 10) {
                    $remaining = max(0, 10 - $existing);
                    $validator->errors()->add(
                        'images',
                        "This property already has {$existing} image(s); you can add at most {$remaining} more (10 total)."
                    );
                }
            },
        ];
    }
}
