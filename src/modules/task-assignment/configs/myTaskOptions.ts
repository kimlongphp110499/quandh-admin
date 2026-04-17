// Static option arrays dùng cho AppSelect, filter bar, v.v.

export const MY_TASK_STATUS_OPTIONS = [
  { title: 'Hoạt động', value: 'active' },
  { title: 'Không hoạt động', value: 'inactive' },
] as const

export const MY_TASK_TABLE_HEADERS = [
  { title: 'STT', key: 'index', sortable: false, align: 'center' as const, width: '60px', minWidth: '60px' },
  { title: 'Công việc', key: 'name', sortable: true, align: 'start' as const, minWidth: '240px' },
  { title: 'Văn bản giao việc', key: 'document', sortable: true, align: 'start' as const, minWidth: '180px' },
  { title: 'Vai trò của tôi', key: 'my_assignment', sortable: false, align: 'center' as const, width: '140px', minWidth: '140px' },
  { title: 'Người giao', key: 'created_by', sortable: true, align: 'start' as const, width: '140px', minWidth: '140px' },
  { title: 'Trạng thái', key: 'processing_status', sortable: true, align: 'start' as const, width: '150px', minWidth: '150px' },
  { title: 'Ưu tiên', key: 'priority', sortable: true, align: 'start' as const, width: '110px', minWidth: '110px' },
  { title: 'Thời hạn', key: 'dates', sortable: false, align: 'start' as const, width: '160px', minWidth: '160px' },
  { title: '% Hoàn thành', key: 'completion_percent', sortable: true, align: 'center' as const, width: '110px', minWidth: '110px' },
  { title: 'Hành động', key: 'actions', sortable: false, align: 'center' as const, width: '100px', minWidth: '100px' },
] as const

export const MY_TASK_LIMIT_OPTIONS = [10, 15, 20, 50, 100] as const
