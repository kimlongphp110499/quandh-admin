// Static option arrays dùng cho AppSelect, filter bar, v.v.

export const ITEM_STATUS_OPTIONS = [
  { title: 'Chưa bắt đầu', value: 'todo' },
  { title: 'Đang thực hiện', value: 'in_progress' },
  { title: 'Hoàn thành', value: 'done' },
  { title: 'Quá hạn', value: 'overdue' },
  { title: 'Tạm dừng', value: 'paused' },
  { title: 'Đã hủy', value: 'cancelled' },
] as const

export const ITEM_PRIORITY_OPTIONS = [
  { title: 'Tất cả', value: '' },
  { title: 'Thấp', value: 'low' },
  { title: 'Bình thường', value: 'medium' },
  { title: 'Cao', value: 'high' },
  { title: 'Khẩn cấp', value: 'urgent' },
] as const

export const ITEM_DEADLINE_TYPE_OPTIONS = [
  { title: 'Có thời hạn', value: 'has_deadline' },
  { title: 'Không có thời hạn', value: 'no_deadline' },
] as const

export const DEPARTMENT_ROLE_OPTIONS = [
  { title: 'Chủ trì', value: 'main' },
  { title: 'Phối hợp', value: 'cooperate' },
] as const

export const ASSIGNMENT_STATUS_OPTIONS = [
  { title: 'Đã giao', value: 'assigned' },
  { title: 'Đã nhận', value: 'accepted' },
  { title: 'Từ chối', value: 'rejected' },
  { title: 'Hoàn thành', value: 'done' },
] as const

export const ASSIGNMENT_ROLE_OPTIONS = [
  { title: 'Chủ trì', value: 'main' },
  { title: 'Phối hợp', value: 'support' },
] as const

export const ITEM_TABLE_HEADERS = [
  { title: '', key: 'data-table-select', sortable: false },
  { title: 'STT', key: 'index', sortable: false, align: 'center' as const, width: '60px', minWidth: '60px' },
  { title: 'Tên công việc', key: 'name', sortable: true, align: 'start' as const, minWidth: '220px' },
  { title: 'Văn bản', key: 'document', sortable: false, align: 'start' as const, minWidth: '160px' },
  { title: 'Phòng ban', key: 'departments', sortable: false, align: 'start' as const, minWidth: '140px' },
  { title: 'Trạng thái', key: 'processing_status', sortable: true, align: 'start' as const, width: '150px', minWidth: '150px' },
  { title: 'Ưu tiên', key: 'priority', sortable: true, align: 'start' as const, width: '120px', minWidth: '120px' },
  { title: 'Thời hạn', key: 'end_at', sortable: true, align: 'start' as const, width: '130px', minWidth: '130px' },
  { title: '% Hoàn thành', key: 'completion_percent', sortable: true, align: 'center' as const, width: '90px', minWidth: '90px' },
  { title: 'Ngày tạo', key: 'created_at', sortable: true, align: 'start' as const, width: '160px', minWidth: '160px' },
  { title: 'Ngày cập nhật', key: 'updated_at', sortable: true, align: 'start' as const, width: '160px', minWidth: '160px' },
  { title: 'Hành động', key: 'actions', sortable: false, align: 'start' as const, width: '100px', minWidth: '160px' },
] as const

export const ITEM_LIMIT_OPTIONS = [10, 15, 20, 50, 100] as const
