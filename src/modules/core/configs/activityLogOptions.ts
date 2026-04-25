// Static option arrays dùng cho AppSelect, filter bar, v.v.

export const ACTIVITY_LOG_METHOD_OPTIONS = [
  { title: 'GET', value: 'GET' },
  { title: 'POST', value: 'POST' },
  { title: 'PUT', value: 'PUT' },
  { title: 'PATCH', value: 'PATCH' },
  { title: 'DELETE', value: 'DELETE' },
] as const

export const ACTIVITY_LOG_LIMIT_OPTIONS = [10, 15, 20, 50, 100] as const
