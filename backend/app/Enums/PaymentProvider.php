<?php

namespace App\Enums;

enum PaymentProvider: string
{
    case Cmi = 'cmi';
    case Cash = 'cash';
    case BankTransfer = 'bank_transfer';
}
