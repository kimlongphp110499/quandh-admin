// Static option arrays dùng cho AppSelect, filter bar, v.v.

export const ITEM_TYPE_STATUS_OPTIONS = [
  { title: 'Hoạt động', value: 'active' },
  { title: 'Không hoạt động', value: 'inactive' },
] as const

export const ITEM_TYPE_TABLE_HEADERS = [
  { title: '', key: 'data-table-select', sortable: false },
  { title: 'STT', key: 'index', sortable: false, align: 'center' as const, width: '60px', minWidth: '60px' },
  { title: 'Tên loại công việc', key: 'name', sortable: true, align: 'start' as const, minWidth: '240px' },
  { title: 'Trạng thái', key: 'status', sortable: true, align: 'start' as const, width: '120px', minWidth: '120px' },
  { title: 'Ngày tạo', key: 'created_at', sortable: true, align: 'start' as const, width: '160px', minWidth: '160px' },
  { title: 'Ngày cập nhật', key: 'updated_at', sortable: true, align: 'start' as const, width: '160px', minWidth: '160px' },
  { title: 'Hành động', key: 'actions', sortable: false, align: 'start' as const, width: '120px', minWidth: '160px' },
] as const

export const ITEM_TYPE_LIMIT_OPTIONS = [10, 15, 20, 50, 100] as const
