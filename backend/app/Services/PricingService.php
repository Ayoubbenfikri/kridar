<?php

namespace App\Services;

use App\Enums\RentalType;
use App\Models\Property;
use Carbon\CarbonInterface;

/**
 * Computes reservation pricing server-side, always — a price sent from
 * the frontend is never trusted (project rule: backend validates
 * everything, frontend values are display-only).
 */
class PricingService
{
    /**
     * @return array{unit_price: float, total_price: float}
     */
    public function calculate(Property $property, RentalType $rentalType, CarbonInterface $startDate, CarbonInterface $endDate): array
    {
        if ($rentalType === RentalType::LongTerm) {
            $unitPrice = (float) $property->price_per_month;

            // Billed in whole months, rounding UP any partial month — the
            // standard practice for a monthly lease (you pay for the
            // whole month even if you move out partway through it).
            $months = (int) ceil($startDate->diffInDays($endDate) / 30);

            return [
                'unit_price' => $unitPrice,
                'total_price' => round($unitPrice * $months, 2),
            ];
        }

        $unitPrice = (float) $property->price_per_night;
        $nights = $startDate->diffInDays($endDate);

        return [
            'unit_price' => $unitPrice,
            'total_price' => round($unitPrice * $nights, 2),
        ];
    }
}
