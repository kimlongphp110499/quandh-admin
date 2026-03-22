<?php

namespace App\Modules\Meeting\Exports;

use App\Modules\Meeting\Models\Meeting;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class MeetingsExport implements FromCollection, WithHeadings
{
    public function __construct(protected array $filters = []) {}

    public function collection()
    {
        return Meeting::with(['creator', 'editor'])
            ->filter($this->filters)
            ->get()
            ->map(fn (Meeting $meeting) => [
                'id'          => $meeting->id,
                'title'       => $meeting->title,
                'description' => $meeting->description,
                'location'    => $meeting->location,
                'start_at'    => $meeting->start_at?->format('d/m/Y H:i'),
                'end_at'      => $meeting->end_at?->format('d/m/Y H:i'),
                'status'      => $meeting->status,
                'created_by'  => $meeting->creator?->name ?? 'N/A',
                'updated_by'  => $meeting->editor?->name ?? 'N/A',
                'created_at'  => $meeting->created_at?->format('d/m/Y H:i:s'),
                'updated_at'  => $meeting->updated_at?->format('d/m/Y H:i:s'),
            ]);
    }

    public function headings(): array
    {
        return [
            'ID',
            'Tiêu đề',
            'Mô tả',
            'Địa điểm',
            'Bắt đầu',
            'Kết thúc',
            'Trạng thái',
            'Người tạo',
            'Người cập nhật',
            'Ngày tạo',
            'Ngày cập nhật',
        ];
    }
}
