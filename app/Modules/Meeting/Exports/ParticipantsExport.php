<?php

namespace App\Modules\Meeting\Exports;

use App\Modules\Meeting\Models\Meeting;
use App\Modules\Meeting\Models\Participant;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ParticipantsExport implements FromCollection, WithHeadings
{
    public function __construct(protected Meeting $meeting) {}

    public function collection()
    {
        return $this->meeting->participantRecords()->with('user')->get()
            ->map(fn (Participant $p) => [
                'id'                => $p->id,
                'user_id'           => $p->user_id,
                'name'              => $p->user?->name ?? 'N/A',
                'email'             => $p->user?->email ?? 'N/A',
                'position'          => $p->position,
                'meeting_role'      => $p->meeting_role,
                'attendance_status' => $p->attendance_status,
                'checkin_at'        => $p->checkin_at?->format('d/m/Y H:i:s'),
                'absence_reason'    => $p->absence_reason,
            ]);
    }

    public function headings(): array
    {
        return [
            'ID',
            'User ID',
            'Họ tên',
            'Email',
            'Chức vụ',
            'Vai trò',
            'Trạng thái điểm danh',
            'Check-in lúc',
            'Lý do vắng',
        ];
    }
}
