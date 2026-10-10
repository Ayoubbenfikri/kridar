<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * GET /admin/analytics?range=7d|30d|90d (Phase A2).
 *
 * Only these three periods: a free "from/to" would let one request scan
 * the whole table, and the admin page only offers these three buttons.
 * Who may call it is decided by the route ('admin' middleware), not here.
 */
class AnalyticsReportRequest extends FormRequest
{
    public const RANGES = [
        '7d' => 7,
        '30d' => 30,
        '90d' => 90,
    ];

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
            'range' => ['sometimes', Rule::in(array_keys(self::RANGES))],
        ];
    }

    public function range(): string
    {
        return $this->validated('range') ?? '30d';
    }

    /** Number of days in the chosen period, today included. */
    public function days(): int
    {
        return self::RANGES[$this->range()];
    }
}
