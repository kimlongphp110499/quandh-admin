<?php

namespace App\Modules\Meeting\Enums;

enum VoteOptionEnum: string
{
    case Agree = 'agree';      // Đồng ý
    case Disagree = 'disagree'; // Không đồng ý
    case Abstain = 'abstain';  // Không biểu quyết

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function rule(): string
    {
        return 'in:' . implode(',', self::values());
    }

    public function label(): string
    {
        return match ($this) {
            self::Agree => 'Đồng ý',
            self::Disagree => 'Không đồng ý',
            self::Abstain => 'Không biểu quyết',
        };
    }
}
