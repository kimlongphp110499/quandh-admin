<?php

namespace App\Modules\Meeting\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkDestroyMeetingRequest extends FormRequest
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
        ];
    }

    public function messages(): array
    {
        return [
            'ids.required' => 'Bạn chưa chọn cuộc họp nào.',
            'ids.*.exists' => 'Một trong các cuộc họp không tồn tại.',
        ];
    }
}
