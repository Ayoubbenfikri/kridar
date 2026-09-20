<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PayPal integration (sandbox).
 *
 * Purely ADDITIVE - three nullable columns, no column altered, no data
 * touched. Run it with a plain `php artisan migrate`; there is no need
 * for migrate:fresh and nothing to lose.
 *
 * Why these three:
 *
 *   provider_order_id   PayPal's flow has TWO identifiers, not one. The
 *                       ORDER id is created before the buyer approves;
 *                       the CAPTURE id only exists after. The existing
 *                       provider_transaction_id keeps holding the final
 *                       capture id, so the order id needs its own home -
 *                       and it is what we check the returning browser
 *                       against.
 *
 *   converted_amount    What PayPal actually charged, in its own
 *   converted_currency  currency. `amount` stays the MAD figure so every
 *                       revenue query in AdminService keeps working
 *                       unchanged; this pair is the audit trail of the
 *                       conversion that happened at payment time.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('provider_order_id')->nullable()->after('provider');
            $table->decimal('converted_amount', 10, 2)->nullable()->after('currency');
            $table->string('converted_currency', 3)->nullable()->after('converted_amount');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['provider_order_id', 'converted_amount', 'converted_currency']);
        });
    }
};
