<?php

namespace App\Modules\Meeting\Requests;

use App\Modules\Meeting\Enums\VoteOptionEnum;
use Illuminate\Foundation\Http\FormRequest;
use App\Modules\Meeting\Models\Participant; 

class SubmitVoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $meeting = $this->route('meeting');

            $isParticipant = Participant::where('meeting_id', $meeting->id)
                ->where('user_id', auth()->id())
                ->exists();

            if (! $isParticipant) {
                $validator->errors()->add('participant', 'Bạn không phải đại biểu của cuộc họp này.');
            }
        });
    }

    public function rules(): array
    {
        return [
            'vote_option' => ['required', VoteOptionEnum::rule()],
        ];
    }

    public function messages(): array
    {
        return [
            'vote_option.required' => 'Lựa chọn biểu quyết không được để trống.',
            'vote_option.in' => 'Lựa chọn biểu quyết không hợp lệ. Chấp nhận: agree, disagree, abstain.',
        ];
    }
}
