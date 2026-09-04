<?php

namespace App\Http\Requests\Reservation;

use App\Enums\PropertyStatus;
use App\Enums\RentalType;
use App\Models\Property;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReservationRequest extends FormRequest
{
    /**
     * Any authenticated + verified user can request a booking — that much
     * is enforced by route middleware. Whether THIS user can book THIS
     * property (not their own, right rental_type, etc.) is checked below
     * in after(), since those checks need the property record.
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
            'property_id' => ['required', 'integer', 'exists:properties,id'],
            // A reservation is always one or the other, never "both" —
            // "both" only describes what a property offers (see
            // RentalType's docblock).
            'rental_type' => ['required', Rule::enum(RentalType::class)->except(RentalType::Both)],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'guests_count' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * Business rules that need the actual Property row, so they can't be
     * plain "rules()" entries. The truly race-condition-sensitive check
     * — "are these dates ACTUALLY still free" — happens later, inside
     * ReservationService::create()'s locked transaction, not here.
     *
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

                if ($property->status !== PropertyStatus::Published) {
                    $validator->errors()->add('property_id', 'This property is not available for booking.');

                    return;
                }

                if ($this->user() && $property->owner_id === $this->user()->id) {
                    $validator->errors()->add('property_id', 'You cannot book your own property.');

                    return;
                }

                $rentalType = $this->input('rental_type');
                $propertyOffers = fn (string $mode) => in_array($property->rental_type->value, [$mode, RentalType::Both->value], true);

                if ($rentalType === RentalType::ShortTerm->value && ! $propertyOffers(RentalType::ShortTerm->value)) {
                    $validator->errors()->add('rental_type', 'This property does not offer short-term (nightly) rental.');

                    return;
                }

                if ($rentalType === RentalType::LongTerm->value && ! $propertyOffers(RentalType::LongTerm->value)) {
                    $validator->errors()->add('rental_type', 'This property does not offer long-term (monthly) rental.');

                    return;
                }

                if ($rentalType === RentalType::ShortTerm->value) {
                    $guestsCount = $this->input('guests_count');
                    if ($guestsCount !== null && $property->max_guests !== null && (int) $guestsCount > $property->max_guests) {
                        $validator->errors()->add('guests_count', "This property accommodates at most {$property->max_guests} guest(s).");
                    }
                }

                if ($rentalType === RentalType::LongTerm->value && $this->input('start_date') && $this->input('end_date')) {
                    $minEndDate = Carbon::parse($this->input('start_date'))->addMonth();
                    if (Carbon::parse($this->input('end_date'))->lt($minEndDate)) {
                        $validator->errors()->add('end_date', 'A long-term booking must be at least 1 month.');
                    }
                }
            },
        ];
    }
}
