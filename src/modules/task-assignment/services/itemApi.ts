// eslint-disable-next-line import/extensions, import/no-unresolved
import apiClient, { type ApiResponse } from '@/api/client'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { normalizeDate } from '@/utils/formatters'

export type ItemStatus = 'todo' | 'in_progress' | 'done' | 'overdue' | 'paused' | 'cancelled'
export type ItemPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ItemDeadlineType = 'has_deadline' | 'no_deadline'

export interface ItemDepartment {
  id: number
  code: string
  name: string
  role: 'main' | 'cooperate'
}

export interface ItemUser {
  id: number
  name: string
  department_id: number
  assignment_role: 'main' | 'support'
  assignment_status: 'assigned' | 'accepted' | 'rejected' | 'done'
  assigned_at?: string
  accepted_at?: string
  completed_at?: string
  note?: string
}

export interface Item {
  id: number
  task_assignment_document_id: number
  document?: { id: number; name: string }
  name: string
  description?: string
  task_assignment_item_type_id?: number
  item_type?: { id: number; name: string }
  deadline_type: ItemDeadlineType
  start_at?: string
  end_at?: string
  processing_status: ItemStatus
  completion_percent: number
  priority?: ItemPriority
  completed_at?: string
  departments?: ItemDepartment[]
  users?: ItemUser[]
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface ItemStats {
  total: number
  todo: number
  in_progress: number
  done: number
  overdue: number
  paused: number
  cancelled: number
}

export interface StatsByDepartmentItem {
  department_id: number | null
  department_name: string | null
  total: number
  in_progress: number
  done: number
  overdue: number
}

export interface StatsByUserItem {
  user_id: number
  user_name: string
  total: number
  done: number
  overdue: number
}

export interface StatsByTimeItem {
  period: string
  total: number
  done: number
  overdue: number
}

export interface ItemFilters {
  page?: number
  limit?: number
  search?: string
  processing_status?: ItemStatus
  priority?: ItemPriority
  deadline_type?: ItemDeadlineType
  completion_percent_from?: number
  completion_percent_to?: number
  start_from?: string
  start_to?: string
  end_from?: string
  end_to?: string
  from_date?: string
  to_date?: string
  task_assignment_document_id?: number
  task_assignment_item_type_id?: number
  task_assignment_type_id?: number
  department_id?: number
  user_id?: number
  assignment_role?: 'main' | 'support'
  assignment_status?: 'assigned' | 'accepted' | 'rejected' | 'done'
  sort_by?: 'id' | 'name' | 'priority' | 'end_at' | 'completion_percent' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
}

export interface ItemDepartmentPayload {
  department_id: number
  role?: 'main' | 'cooperate'
}

export interface ItemUserPayload {
  user_id: number
  department_id: number
  assignment_role?: 'main' | 'support'
  assignment_status?: 'assigned' | 'accepted' | 'rejected' | 'done'
  note?: string
}

export interface ItemFormData {
  task_assignment_document_id: number
  name: string
  description?: string
  task_assignment_item_type_id?: number | null
  deadline_type: ItemDeadlineType
  start_at?: string
  end_at?: string
  processing_status?: ItemStatus
  completion_percent?: number
  priority?: ItemPriority
  department_ids?: ItemDepartmentPayload[]
  user_assignments?: ItemUserPayload[]
}

export interface ItemProgressData {
  processing_status?: ItemStatus
  completion_percent?: number
  note?: string
}

export interface ItemReportAttachment {
  id: number
  file_name: string
  file_url: string
  file_size?: number
  mime_type?: string
}

export interface ItemReport {
  id: number
  task_assignment_item_id: number
  completed_at?: string
  report_document_number?: string
  report_document_excerpt?: string
  report_document_content?: string
  attachments?: ItemReportAttachment[]
  created_at: string
  updated_at: string
}

export interface ItemProgressHistory {
  id: number
  task_assignment_item_id: number
  user_id: number
  user_name?: string
  old_processing_status?: ItemStatus
  new_processing_status?: ItemStatus
  old_completion_percent?: number
  new_completion_percent?: number
  note?: string
  created_at: string
}

export interface ItemReportFormData {
  completed_at?: string
  report_document_number?: string
  report_document_excerpt?: string
  report_document_content?: string
  files?: File[]
}

export const itemApi = {
  list(filters?: ItemFilters) {
    return apiClient.get<ApiResponse<Item[]>>('/task-assignment-items', { params: filters })
  },

  show(id: number) {
    return apiClient.get<ApiResponse<Item>>(`/task-assignment-items/${id}`)
  },

  create(data: ItemFormData) {
    return apiClient.post<ApiResponse<Item>>('/task-assignment-items', data)
  },

  update(id: number, data: Partial<ItemFormData>) {
    return apiClient.put<ApiResponse<Item>>(`/task-assignment-items/${id}`, {
      ...data,
      start_at: normalizeDate(data.start_at),
      end_at: normalizeDate(data.end_at),
    })
  },

  delete(id: number) {
    return apiClient.delete<ApiResponse>(`/task-assignment-items/${id}`)
  },

  stats(filters?: ItemFilters) {
    return apiClient.get<ApiResponse<ItemStats>>('/task-assignment-items/stats', { params: filters })
  },

  changeStatus(id: number, status: ItemStatus) {
    return apiClient.patch<ApiResponse<Item>>(`/task-assignment-items/${id}/status`, { status })
  },

  bulkDelete(ids: number[]) {
    return apiClient.post<ApiResponse>('/task-assignment-items/bulk-delete', { ids })
  },

  bulkUpdateStatus(ids: number[], status: ItemStatus) {
    return apiClient.patch<ApiResponse>('/task-assignment-items/bulk-status', { ids, status })
  },

  export(filters?: ItemFilters) {
    return apiClient.get('/task-assignment-items/export', {
      params: filters,
      responseType: 'blob',
    })
  },

  downloadTemplate() {
    return apiClient.get('/task-assignment-items/import/template', {
      responseType: 'blob',
    })
  },

  import(file: File) {
    const formData = new FormData()

    formData.append('file', file)

    return apiClient.post<ApiResponse>('/task-assignment-items/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  overdue(filters?: ItemFilters) {
    return apiClient.get<ApiResponse<Item[]>>('/task-assignment-items/overdue', { params: filters })
  },

  upcomingDeadline(filters?: ItemFilters & { days?: number }) {
    return apiClient.get<ApiResponse<Item[]>>('/task-assignment-items/upcoming-deadline', { params: filters })
  },

  updateProgress(id: number, data: ItemProgressData) {
    return apiClient.patch<ApiResponse<Item>>(`/task-assignment-items/${id}/progress`, data)
  },

  getProgressHistory(id: number) {
    return apiClient.get<ApiResponse<ItemProgressHistory[]>>(`/task-assignment-items/${id}/progress-history`)
  },

  getReports(id: number) {
    return apiClient.get<ApiResponse<ItemReport[]>>(`/task-assignment-items/${id}/reports`)
  },

  createReport(id: number, data: ItemReportFormData) {
    const formData = new FormData()

    if (data.completed_at)
      formData.append('completed_at', data.completed_at)
    if (data.report_document_number)
      formData.append('report_document_number', data.report_document_number)
    if (data.report_document_excerpt)
      formData.append('report_document_excerpt', data.report_document_excerpt)
    if (data.report_document_content)
      formData.append('report_document_content', data.report_document_content)
    if (data.files)
      data.files.forEach(f => formData.append('files[]', f))

    return apiClient.post<ApiResponse<ItemReport>>(`/task-assignment-items/${id}/reports`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  updateReport(reportId: number, data: ItemReportFormData) {
    const formData = new FormData()

    formData.append('_method', 'PATCH')
    if (data.completed_at)
      formData.append('completed_at', data.completed_at)
    if (data.report_document_number)
      formData.append('report_document_number', data.report_document_number)
    if (data.report_document_excerpt)
      formData.append('report_document_excerpt', data.report_document_excerpt)
    if (data.report_document_content)
      formData.append('report_document_content', data.report_document_content)
    if (data.files)
      data.files.forEach(f => formData.append('files[]', f))

    return apiClient.post<ApiResponse<ItemReport>>(`/task-assignment-item-reports/${reportId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  statsByDepartment(filters?: ItemFilters) {
    return apiClient.get<ApiResponse<StatsByDepartmentItem[]>>('/task-assignment-items/stats-by-department', { params: filters })
  },

  statsByUser(filters?: ItemFilters) {
    return apiClient.get<ApiResponse<StatsByUserItem[]>>('/task-assignment-items/stats-by-user', { params: filters })
  },

  statsByTime(filters?: ItemFilters & { group_by?: 'week' | 'month' | 'quarter' }) {
    return apiClient.get<ApiResponse<StatsByTimeItem[]>>('/task-assignment-items/stats-by-time', { params: filters })
  },
}
