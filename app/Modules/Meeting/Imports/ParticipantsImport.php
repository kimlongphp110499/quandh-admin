<?php

namespace App\Modules\Meeting\Imports;

use App\Modules\Core\Models\User;
use App\Modules\Meeting\Enums\MeetingRoleEnum;
use App\Modules\Meeting\Models\Meeting;
use App\Modules\Meeting\Models\Participant;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ParticipantsImport implements ToModel, WithHeadingRow
{
    public function __construct(protected Meeting $meeting) {}

    /**
     * Cột Excel: email (required), meeting_role (optional), position (optional).
     * Bỏ qua dòng nếu email không tồn tại hoặc đã là đại biểu của cuộc họp này.
     */
    public function model(array $row): ?Participant
    {
        if (empty($row['email'])) {
            return null;
        }

        $user = User::where('email', $row['email'])->first();

        if (! $user) {
            return null;
        }

        $alreadyExists = Participant::where('meeting_id', $this->meeting->id)
            ->where('user_id', $user->id)
            ->exists();

        if ($alreadyExists) {
            return null;
        }

        return new Participant([
            'meeting_id'   => $this->meeting->id,
            'user_id'      => $user->id,
            'meeting_role' => $row['meeting_role'] ?? MeetingRoleEnum::Delegate->value,
            'position'     => $row['position'] ?? null,
        ]);
    }
}
