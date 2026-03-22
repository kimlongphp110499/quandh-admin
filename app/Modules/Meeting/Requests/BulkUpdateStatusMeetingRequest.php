<?php

namespace App\Modules\Meeting\Requests;

use App\Modules\Meeting\Enums\MeetingStatusEnum;
use Illuminate\Foundation\Http\FormRequest;

class BulkUpdateStatusMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:m_meetings,id',
            'status' => ['required', MeetingStatusEnum::rule()],
        ];
    }

    public function messages(): array
    {
        return [
            'ids.required' => 'Bạn chưa chọn cuộc họp nào.',
            'ids.*.exists' => 'Một trong các cuộc họp không tồn tại.',
            'status.required' => 'Trạng thái không được để trống.',
            'status.in' => 'Trạng thái không hợp lệ. Chấp nhận: draft, active, in_progress, ended.',
        ];
    }
}
