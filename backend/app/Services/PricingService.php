<?php

namespace App\Services;

use App\Enums\RentalType;
use App\Models\Property;
use Carbon\CarbonInterface;

/**
 * Computes reservation pricing server-side, always — a price sent from
 * the frontend is never trusted (project rule: backend validates
 * everything, frontend values are display-only).
 *
 * Phase 22 (pricing) also makes this the one place Kridar's commission
 * is worked out. The split it returns is what ReservationService
 * snapshots onto the reservation, so a later rate change by the admin
 * never rewrites a booking that was already agreed.
 */
class PricingService
{
    public function __construct(
        private readonly SettingService $settings,
    ) {}

    /**
     * @return array{
     *     unit_price: float,
     *     units: int,
     *     total_price: float,
     *     commission_rate: float,
     *     commission_amount: float,
     *     owner_amount: float
     * }
     */
    public function calculate(Property $property, RentalType $rentalType, CarbonInterface $startDate, CarbonInterface $endDate): array
    {
        if ($rentalType === RentalType::LongTerm) {
            $unitPrice = (float) $property->price_per_month;

            // Billed in whole months, rounding UP any partial month — the
            // standard practice for a monthly lease (you pay for the
            // whole month even if you move out partway through it).
            $months = (int) ceil($startDate->diffInDays($endDate) / 30);

            // Rate 0: Kridar takes NOTHING from rent. Its long-term
            // income is the one-off publication fee the owner already
            // paid, not a cut of the lease — and Kridar neither holds
            // the rent nor manages the contract.
            return $this->split($unitPrice, $months, 0.0);
        }

        $unitPrice = (float) $property->price_per_night;
        $nights = $startDate->diffInDays($endDate);

        return $this->split($unitPrice, $nights, $this->settings->commissionRate());
    }

    /**
     * @param  float  $rate  commission in percent (10.0 = 10%)
     * @return array{
     *     unit_price: float,
     *     units: int,
     *     total_price: float,
     *     commission_rate: float,
     *     commission_amount: float,
     *     owner_amount: float
     * }
     */
    private function split(float $unitPrice, int $units, float $rate): array
    {
        $totalPrice = round($unitPrice * $units, 2);
        $commission = round($totalPrice * $rate / 100, 2);

        return [
            'unit_price' => $unitPrice,
            'units' => $units,
            // What the guest pays.
            'total_price' => $totalPrice,
            'commission_rate' => $rate,
            // What Kridar keeps.
            'commission_amount' => $commission,
            // What the owner receives. Subtracted rather than computed
            // from the rate a second time, so the two parts always add
            // back up to exactly total_price even after rounding.
            'owner_amount' => round($totalPrice - $commission, 2),
        ];
    }
}
