// Static option arrays dùng cho AppSelect, filter bar, v.v.

export const DOCUMENT_STATUS_OPTIONS = [
  { title: 'Bản nháp', value: 'draft' },
  { title: 'Ban hành', value: 'issued' },
] as const

export const DOCUMENT_TABLE_HEADERS = [
  { title: '', key: 'data-table-select', sortable: false },
  { title: 'STT', key: 'index', sortable: false, align: 'center' as const, width: '60px', minWidth: '60px' },
  { title: 'Tên văn bản', key: 'name', sortable: true, align: 'start' as const, minWidth: '240px' },
  { title: 'Loại văn bản', key: 'type', sortable: false, align: 'start' as const, minWidth: '160px' },
  { title: 'Ngày ban hành', key: 'issue_date', sortable: true, align: 'start' as const, width: '140px', minWidth: '140px' },
  { title: 'Trạng thái', key: 'status', sortable: true, align: 'start' as const, width: '140px', minWidth: '140px' },
  { title: 'Thời điểm ban hành', key: 'issued_at', sortable: true, align: 'start' as const, width: '160px', minWidth: '160px' },
  { title: 'Ngày tạo', key: 'created_at', sortable: true, align: 'start' as const, width: '160px', minWidth: '160px' },
  { title: 'Ngày cập nhật', key: 'updated_at', sortable: true, align: 'start' as const, width: '160px', minWidth: '160px' },
  { title: 'Hành động', key: 'actions', sortable: false, align: 'start' as const, width: '120px', minWidth: '160px' },
] as const

export const DOCUMENT_DETAIL_TABLE_HEADERS = [
  { title: 'STT', key: 'index', sortable: false, align: 'center' as const, width: '60px', minWidth: '60px' },
  { title: 'Tên công việc', key: 'name', sortable: false, align: 'start' as const, minWidth: '220px' },
  { title: 'Phòng ban', key: 'departments', sortable: false, align: 'start' as const, minWidth: '140px' },
  { title: 'Người thực hiện', key: 'users', sortable: false, align: 'start' as const, minWidth: '160px' },
  { title: 'Trạng thái', key: 'processing_status', sortable: false, align: 'start' as const, width: '150px', minWidth: '150px' },
  { title: 'Ưu tiên', key: 'priority', sortable: false, align: 'start' as const, width: '120px', minWidth: '120px' },
  { title: 'Thời hạn', key: 'end_at', sortable: false, align: 'start' as const, width: '130px', minWidth: '130px' },
  { title: '% Hoàn thành', key: 'completion_percent', sortable: false, align: 'center' as const, width: '90px', minWidth: '90px' },
  { title: 'Hành động', key: 'actions', sortable: false, align: 'start' as const, width: '100px', minWidth: '100px' },
] as const

export const DOCUMENT_LIMIT_OPTIONS = [10, 15, 20, 50, 100] as const
