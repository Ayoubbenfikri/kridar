<?php

namespace App\Http\Requests\RoommateListing;

use App\Enums\RoommateListingType;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoommateListingRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Real authorization (poster/admin only) happens via
        // RoommateListingPolicy in the controller.
        return true;
    }

    /**
     * Every field optional (PATCH-style partial update). Like
     * UpdatePropertyRequest, we deliberately don't cross-validate `type`
     * against the offer-only fields here — a partial update may not
     * include `type` at all, so there is no "other side" of that rule to
     * check in the same request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['sometimes', Rule::enum(RoommateListingType::class)],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string', 'min:20'],

            'city' => ['sometimes', 'string', 'max:120'],
            'neighborhood' => ['nullable', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],

            'price_per_person' => ['nullable', 'numeric', 'min:0'],
            'budget_min' => ['nullable', 'numeric', 'min:0'],
            'budget_max' => ['nullable', 'numeric', 'min:0'],
            'beds' => ['nullable', 'integer', 'min:1', 'max:20'],
            'bedrooms' => ['nullable', 'integer', 'min:1', 'max:20'],
            'furnished' => ['nullable', 'boolean'],
            'available_from' => ['nullable', 'date'],
            'people_count' => ['nullable', 'integer', 'min:1', 'max:10'],
        ];
    }

    /**
     * Only checked when BOTH bounds are present in this request — same
     * reasoning as the docblock above: a partial update might send just
     * one of the two, and there is no "other side" to compare against
     * without re-fetching the model, which this request deliberately
     * doesn't do.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (ValidatorContract $validator): void {
                $min = $this->input('budget_min');
                $max = $this->input('budget_max');

                if ($min !== null && $max !== null && (float) $max < (float) $min) {
                    $validator->errors()->add('budget_max', 'budget_max must be greater than or equal to budget_min.');
                }
            },
        ];
    }
}
