<?php

namespace App\Modules\Meeting\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReorderAgendasRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'orders' => 'required|array|min:1',
            'orders.*.id' => 'required|integer|exists:m_agendas,id',
            'orders.*.order_index' => 'required|integer|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'orders.required' => 'Danh sách thứ tự không được để trống.',
            'orders.*.id.exists' => 'Mục họp không tồn tại.',
            'orders.*.order_index.required' => 'Thứ tự không được để trống.',
        ];
    }
}
