<?php

namespace App\Modules\Meeting\Imports;

use App\Modules\Meeting\Enums\MeetingStatusEnum;
use App\Modules\Meeting\Models\Meeting;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class MeetingsImport implements ToModel, WithHeadingRow
{
    public function model(array $row): ?Meeting
    {
        if (empty($row['title'])) {
            return null;
        }

        return new Meeting([
            'title'       => $row['title'],
            'description' => $row['description'] ?? null,
            'location'    => $row['location'] ?? null,
            'start_at'    => $this->parseDate($row['start_at'] ?? null),
            'end_at'      => $this->parseDate($row['end_at'] ?? null),
            'status'      => $row['status'] ?? MeetingStatusEnum::Draft->value,
        ]);
    }

     private function parseDate(mixed $value): ?string
    {
        if (empty($value)) {
            return null;
        }

        // Excel lưu ngày dưới dạng số serial (float) — cần convert qua PhpSpreadsheet
        if (is_numeric($value)) {
            return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $value))
                ->format('Y-m-d H:i:s');
        }

        // Nếu là string (ví dụ: "2026-03-25 08:00:00")
        try {
            return Carbon::parse($value)->format('Y-m-d H:i:s');
        } catch (\Exception) {
            return null;
        }
    }
}
