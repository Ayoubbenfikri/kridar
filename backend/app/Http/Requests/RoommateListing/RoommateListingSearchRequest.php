<?php

namespace App\Http\Requests\RoommateListing;

use App\Enums\RoommateListingType;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoommateListingSearchRequest extends FormRequest
{
    /**
     * Public endpoint — anyone (including guests) can search.
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
            'q' => ['sometimes', 'string', 'max:100'],
            'city' => ['sometimes', 'string', 'max:100'],
            'type' => ['sometimes', Rule::enum(RoommateListingType::class)],
            'min_price' => ['sometimes', 'numeric', 'min:0'],
            'max_price' => ['sometimes', 'numeric', 'min:0'],
            'beds' => ['sometimes', 'integer', 'min:0'],
            'bedrooms' => ['sometimes', 'integer', 'min:0'],
            'furnished' => ['sometimes', 'boolean'],
            // "I need to move in by this date" — see
            // EloquentRoommateListingRepository::paginatePublished().
            'available_by' => ['sometimes', 'date'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (ValidatorContract $validator): void {
                $min = $this->input('min_price');
                $max = $this->input('max_price');

                if ($min !== null && $max !== null && (float) $max < (float) $min) {
                    $validator->errors()->add('max_price', 'max_price must be greater than or equal to min_price.');
                }
            },
        ];
    }
}
