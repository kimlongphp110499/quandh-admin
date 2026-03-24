<?php

namespace App\Modules\Meeting\Enums;

enum VotingTypeEnum: string
{
    case Public = 'public';      // Biểu quyết công khai (lưu user_id)
    case Anonymous = 'anonymous'; // Biểu quyết ẩn danh (không lưu user_id)

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
            self::Public => 'Công khai',
            self::Anonymous => 'Ẩn danh',
        };
    }
}
