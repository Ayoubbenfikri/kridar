<?php

namespace App\Http\Requests\Reservation;

use App\Enums\RentalType;
use App\Models\Property;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Phase 22 (pricing) — POST /reservations/price-preview.
 *
 * A read-only estimate: nothing is written, no dates are held. So the
 * heavier business rules from StoreReservationRequest (is the property
 * published, is it your own, is it available, minimum one month) are
 * deliberately NOT repeated here — they belong on the write, and they
 * run there. The only rule kept is "does this property actually offer
 * this rental type", because without it the price would be computed
 * from a null column and come back as 0, which would be a lie rather
 * than an error.
 */
class PricePreviewRequest extends FormRequest
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
            'property_id' => ['required', 'integer', 'exists:properties,id'],
            'rental_type' => ['required', Rule::enum(RentalType::class)->except(RentalType::Both)],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (ValidatorContract $validator): void {
                $property = Property::find($this->input('property_id'));

                if ($property === null) {
                    return; // the 'exists' rule above already reports this
                }

                // Same shape as StoreReservationRequest::after(): the
                // property's own rental_type must be exactly what was
                // asked for, or 'both'.
                $offers = in_array(
                    $property->rental_type->value,
                    [$this->input('rental_type'), RentalType::Both->value],
                    true,
                );

                if (! $offers) {
                    $validator->errors()->add(
                        'rental_type',
                        'This property does not offer that rental type.',
                    );
                }
            },
        ];
    }
}
