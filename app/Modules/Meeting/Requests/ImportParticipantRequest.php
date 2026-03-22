<?php

namespace App\Modules\Meeting\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportParticipantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|mimes:xlsx,xls,csv',
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Vui lòng chọn file để nhập liệu.',
            'file.mimes' => 'File phải có định dạng xlsx, xls hoặc csv.',
        ];
    }
}
