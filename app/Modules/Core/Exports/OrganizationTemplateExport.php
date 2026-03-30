<?php

namespace App\Modules\Core\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class OrganizationTemplateExport implements FromArray, WithHeadings, WithStyles
{
    public function headings(): array
    {
        return ['name', 'slug', 'description', 'status', 'parent_slug', 'sort_order'];
    }

    public function array(): array
    {
        return [
            ['Công ty A', 'cong-ty-a', 'Mô tả tổ chức', 'active', '', 1],
            ['Phòng ban B', 'phong-ban-b', '', 'active', 'cong-ty-a', 2],
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
