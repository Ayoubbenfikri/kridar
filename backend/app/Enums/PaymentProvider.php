<?php

namespace App\Enums;

enum PaymentProvider: string
{
    case Cmi = 'cmi';
    case Paypal = 'paypal';
    case Cash = 'cash';
    case BankTransfer = 'bank_transfer';
}
