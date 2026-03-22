<?php

namespace App\Modules\Meeting\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkDestroyParticipantRequest extends FormRequest
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
        ];
    }

    public function messages(): array
    {
        return [
            'ids.required' => 'Bạn chưa chọn đại biểu nào.',
            'ids.*.exists' => 'Một trong các đại biểu không tồn tại.',
        ];
    }
}
