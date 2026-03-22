<?php

namespace App\Modules\Meeting\Requests;

use App\Modules\Meeting\Enums\AttendanceStatusEnum;
use Illuminate\Foundation\Http\FormRequest;

class BulkUpdateStatusParticipantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:m_participants,id',
            'attendance_status' => ['required', AttendanceStatusEnum::rule()],
        ];
    }

    public function messages(): array
    {
        return [
            'ids.required' => 'Bạn chưa chọn đại biểu nào.',
            'ids.*.exists' => 'Một trong các đại biểu không tồn tại.',
            'attendance_status.required' => 'Trạng thái điểm danh không được để trống.',
            'attendance_status.in' => 'Trạng thái điểm danh không hợp lệ. Chấp nhận: not_arrived, present, absent.',
        ];
    }
}
