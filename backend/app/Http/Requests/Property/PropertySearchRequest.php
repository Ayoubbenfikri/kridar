<?php

namespace App\Http\Requests\Property;

use App\Enums\PropertyType;
use App\Enums\RentalType;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PropertySearchRequest extends FormRequest
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
            'property_type' => ['sometimes', Rule::enum(PropertyType::class)],
            'rental_type' => ['sometimes', Rule::enum(RentalType::class)],
            'min_price' => ['sometimes', 'numeric', 'min:0'],
            'max_price' => ['sometimes', 'numeric', 'min:0'],
            'bedrooms' => ['sometimes', 'integer', 'min:0'],
            'bathrooms' => ['sometimes', 'integer', 'min:0'],
            'max_guests' => ['sometimes', 'integer', 'min:1'],
            'amenities' => ['sometimes', 'array'],
            'amenities.*' => ['integer', 'exists:amenities,id'],
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
