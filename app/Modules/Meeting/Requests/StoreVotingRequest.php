<?php

namespace App\Modules\Meeting\Requests;

use App\Modules\Meeting\Enums\VotingTypeEnum;
use Illuminate\Foundation\Http\FormRequest;

class StoreVotingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }


    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => ['required', VotingTypeEnum::rule()],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Tiêu đề biểu quyết không được để trống.',
            'type.required' => 'Kiểu biểu quyết không được để trống.',
            'type.in' => 'Kiểu biểu quyết không hợp lệ. Chấp nhận: public, anonymous.',
        ];
    }
}
