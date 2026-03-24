<?php

namespace App\Modules\Meeting\Enums;

enum VotingStatusEnum: string
{
    case Pending = 'pending';   // Chờ kích hoạt
    case Active = 'active';     // Đang biểu quyết
    case Closed = 'closed';     // Đã đóng

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
            self::Pending => 'Chờ kích hoạt',
            self::Active => 'Đang diễn ra',
            self::Closed => 'Đã đóng',
        };
    }
}
