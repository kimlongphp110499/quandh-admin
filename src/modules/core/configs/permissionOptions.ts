// Static option arrays dùng cho AppSelect, filter bar, v.v.

export const PERMISSION_SORT_OPTIONS = [
  { title: 'Ngày tạo', value: 'created_at' },
  { title: 'Ngày cập nhật', value: 'updated_at' },
  { title: 'Tên vai trò', value: 'name' },
] as const

export const PERMISSION_TABLE_HEADERS = [
  { title: 'TÊN QUYỀN HẠN', key: 'name', sortable: false, width: '60px', minWidth: '60px' },
  { title: 'THUỘC VAI TRÒ', key: 'name', sortable: true, minWidth: '200px' },
  { title: 'NGÀY TẠO', key: 'created_at', sortable: true, width: '160px', minWidth: '160px' },
  { title: 'NGÀY CẬP NHẬT', key: 'updated_at', sortable: true, width: '160px', minWidth: '160px' },
  { title: 'HÀNH ĐỘNG', key: 'actions', sortable: false, width: '120px', minWidth: '160px' },
] as const

export const PERMISSION_IMPORT_ALLOWED_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
] as const
