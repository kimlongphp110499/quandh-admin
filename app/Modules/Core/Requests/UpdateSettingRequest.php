<?php

namespace App\Modules\Core\Requests;

use App\Modules\Core\Models\Setting;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $validKeys = Setting::pluck('type', 'key')->all();
        $rules = [];

        foreach ($this->all() as $key => $value) {
            if (!isset($validKeys[$key])) {
                continue;
            }

            $type = $validKeys[$key];
            $rules[$key] = $this->ruleForType($type);
        }

        return $rules;
    }

    protected function ruleForType(string $type): array
    {
        return match ($type) {
            'integer' => ['nullable', 'integer', 'min:0'],
            'boolean' => ['nullable', 'boolean'],
            'json' => ['nullable'], // Chấp nhận array hoặc JSON string
            default => ['nullable', 'string', 'max:65535'],
        };
    }

    public function messages(): array
    {
        return [
            '*.string' => 'Giá trị phải là chuỗi.',
            '*.integer' => 'Giá trị phải là số nguyên.',
            '*.boolean' => 'Giá trị phải là true hoặc false.',
            '*.array' => 'Giá trị phải là mảng/đối tượng.',
        ];
    }
}
