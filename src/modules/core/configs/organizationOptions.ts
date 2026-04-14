export const ORG_STATUS_OPTIONS = [
  { title: 'Hoạt động', value: 'active', color: 'success' },
  { title: 'Không hoạt động', value: 'inactive', color: 'secondary' },
] as const

export const ORG_TABLE_HEADERS = [
  { title: 'STT', key: 'index', sortable: false, width: '60px', minWidth: '60px' },
  { title: 'TÊN TỔ CHỨC', key: 'name', sortable: true, minWidth: '200px' },
  { title: 'TRẠNG THÁI', key: 'status', sortable: true, width: '120px', minWidth: '120px' },
  { title: 'NGÀY TẠO', key: 'created_info', sortable: false, width: '160px', minWidth: '160px' },
  { title: 'NGÀY CẬP NHẬT', key: 'updated_info', sortable: false, width: '160px', minWidth: '160px' },
  { title: 'HÀNH ĐỘNG', key: 'actions', sortable: false, width: '120px', minWidth: '160px' },
] as const
