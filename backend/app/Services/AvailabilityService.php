<?php

namespace App\Services;

use App\Enums\ReservationStatus;
use App\Models\Property;
use Carbon\CarbonInterface;

class AvailabilityService
{
    /**
     * Whether [startDate, endDate) is free for this property: no
     * pending/confirmed reservation and no owner-blocked date range
     * overlaps it.
     *
     * end_date is treated as the checkout date (exclusive) — a stay from
     * Jan 1 to Jan 5 occupies nights 1-4 and checks out the morning of
     * the 5th, so a new reservation starting Jan 5 does NOT overlap it.
     * That's why the comparison is strictly "<" / ">" on both sides, not
     * "<=" / ">=".
     */
    public function isAvailable(Property $property, CarbonInterface $startDate, CarbonInterface $endDate): bool
    {
        $overlappingReservation = $property->reservations()
            ->whereIn('status', array_map(fn ($status) => $status->value, ReservationStatus::blocksAvailability()))
            ->where('start_date', '<', $endDate)
            ->where('end_date', '>', $startDate)
            ->exists();

        if ($overlappingReservation) {
            return false;
        }

        return ! $property->blockedDates()
            ->where('start_date', '<', $endDate)
            ->where('end_date', '>', $startDate)
            ->exists();
    }

    /**
     * The booked and owner-blocked date ranges that overlap [start, end]
     * — what the frontend's availability calendar greys out.
     *
     * @return array{
     *     reservations: array<int, array{start_date: string, end_date: string}>,
     *     blocked: array<int, array{start_date: string, end_date: string, reason: string|null}>
     * }
     */
    public function getUnavailableRanges(Property $property, CarbonInterface $startDate, CarbonInterface $endDate): array
    {
        $reservations = $property->reservations()
            ->whereIn('status', array_map(fn ($status) => $status->value, ReservationStatus::blocksAvailability()))
            ->where('start_date', '<', $endDate)
            ->where('end_date', '>', $startDate)
            ->orderBy('start_date')
            ->get(['start_date', 'end_date']);

        $blocked = $property->blockedDates()
            ->where('start_date', '<', $endDate)
            ->where('end_date', '>', $startDate)
            ->orderBy('start_date')
            ->get(['start_date', 'end_date', 'reason']);

        return [
            'reservations' => $reservations->map(fn ($reservation) => [
                'start_date' => $reservation->start_date->toDateString(),
                'end_date' => $reservation->end_date->toDateString(),
            ])->all(),
            'blocked' => $blocked->map(fn ($block) => [
                'start_date' => $block->start_date->toDateString(),
                'end_date' => $block->end_date->toDateString(),
                'reason' => $block->reason,
            ])->all(),
        ];
    }
}
