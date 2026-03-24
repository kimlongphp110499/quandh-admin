<?php

namespace App\Modules\Meeting\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePersonalNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $meetingId = $this->route('meeting')?->id;

        return [
            'meeting_document_id' => [
                'nullable',
                'integer',
                Rule::exists('m_meeting_documents', 'id')->where('meeting_id', $meetingId),
            ],
            'content' => 'required|string',
        ];
    }

    public function messages(): array
    {
        return [
            'content.required' => 'Nội dung ghi chú không được để trống.',
            'meeting_document_id.exists' => 'Tài liệu không thuộc cuộc họp này.',
            'meeting_document_id.integer' => 'ID tài liệu phải là số nguyên.',
        ];
    }
}
