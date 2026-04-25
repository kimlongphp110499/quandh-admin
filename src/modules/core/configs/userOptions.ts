// Static option arrays dùng cho AppSelect, filter bar, v.v.

export const USER_STATUS_OPTIONS = [
  { title: 'Hoạt động', value: 'active', color: 'success' },
  { title: 'Không hoạt động', value: 'inactive', color: 'secondary' },
] as const

export const USER_SORT_OPTIONS = [
  { title: 'Ngày tạo', value: 'created_at' },
  { title: 'Ngày cập nhật', value: 'updated_at' },
  { title: 'Tên', value: 'name' },
  { title: 'Email', value: 'email' },
] as const

export const USER_TABLE_HEADERS = [
  { title: 'STT', key: 'stt', sortable: false, width: '60px', minWidth: '60px' },
  { title: 'TÊN NGƯỜI DÙNG', key: 'name', sortable: true, minWidth: '200px' },
  { title: 'EMAIL', key: 'email', sortable: true, minWidth: '180px' },
  { title: 'TỔ CHỨC & VAI TRÒ', key: 'assignments', sortable: false, minWidth: '200px' },
  { title: 'TRẠNG THÁI', key: 'status', sortable: true, width: '120px', minWidth: '120px' },
  { title: 'NGÀY TẠO', key: 'created_at', sortable: true, width: '160px', minWidth: '160px' },
  { title: 'NGÀY CẬP NHẬT', key: 'updated_at', sortable: true, width: '160px', minWidth: '160px' },
  { title: 'HÀNH ĐỘNG', key: 'actions', sortable: false, width: '120px', minWidth: '160px' },
] as const
