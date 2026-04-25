import apiClient, { type ApiResponse } from '../client'

export type TaskAssignmentItemStatus = 'todo' | 'in_progress' | 'done' | 'overdue' | 'paused' | 'cancelled'
export type TaskAssignmentItemPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskAssignmentItemDeadlineType = 'has_deadline' | 'no_deadline'
import { normalizeDate } from '@/utils/formatters'

export interface TaskAssignmentItemDepartment {
  id: number
  code: string
  name: string
  role: 'main' | 'cooperate'
}

export interface TaskAssignmentItemUser {
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

export interface TaskAssignmentItem {
  id: number
  task_assignment_document_id: number
  document?: { id: number; name: string }
  name: string
  description?: string
  task_assignment_item_type_id?: number
  item_type?: { id: number; name: string }
  deadline_type: TaskAssignmentItemDeadlineType
  start_at?: string
  end_at?: string
  processing_status: TaskAssignmentItemStatus
  completion_percent: number
  priority?: TaskAssignmentItemPriority
  completed_at?: string
  departments?: TaskAssignmentItemDepartment[]
  users?: TaskAssignmentItemUser[]
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface TaskAssignmentItemStats {
  total: number
  todo: number
  in_progress: number
  done: number
  overdue: number
  paused: number
  cancelled: number
}

export interface TaskAssignmentItemFilters {
  page?: number
  limit?: number
  search?: string
  processing_status?: TaskAssignmentItemStatus
  priority?: TaskAssignmentItemPriority
  deadline_type?: TaskAssignmentItemDeadlineType
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

export interface TaskAssignmentItemDepartmentPayload {
  department_id: number
  role?: 'main' | 'cooperate'
}

export interface TaskAssignmentItemUserPayload {
  user_id: number
  department_id: number
  assignment_role?: 'main' | 'support'
  assignment_status?: 'assigned' | 'accepted' | 'rejected' | 'done'
  note?: string
}

export interface TaskAssignmentItemFormData {
  task_assignment_document_id: number
  name: string
  description?: string
  task_assignment_item_type_id?: number | null
  deadline_type: TaskAssignmentItemDeadlineType
  start_at?: string
  end_at?: string
  processing_status?: TaskAssignmentItemStatus
  completion_percent?: number
  priority?: TaskAssignmentItemPriority
  department_ids?: TaskAssignmentItemDepartmentPayload[]
  user_assignments?: TaskAssignmentItemUserPayload[]
}

export interface TaskAssignmentItemProgressData {
  processing_status?: TaskAssignmentItemStatus
  completion_percent?: number
  note?: string
}

export interface TaskAssignmentItemReportAttachment {
  id: number
  file_name: string
  file_url: string
  file_size?: number
  mime_type?: string
}

export interface TaskAssignmentItemReport {
  id: number
  task_assignment_item_id: number
  completed_at?: string
  report_document_number?: string
  report_document_excerpt?: string
  report_document_content?: string
  attachments?: TaskAssignmentItemReportAttachment[]
  created_at: string
  updated_at: string
}

export interface TaskAssignmentItemReportFormData {
  completed_at?: string
  report_document_number?: string
  report_document_excerpt?: string
  report_document_content?: string
  files?: File[]
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

export const taskAssignmentItemApi = {
  list(filters?: TaskAssignmentItemFilters) {
    return apiClient.get<ApiResponse<TaskAssignmentItem[]>>('/task-assignment-items', { params: filters })
  },

  show(id: number) {
    return apiClient.get<ApiResponse<TaskAssignmentItem>>(`/task-assignment-items/${id}`)
  },

  create(data: TaskAssignmentItemFormData) {
    return apiClient.post<ApiResponse<TaskAssignmentItem>>('/task-assignment-items', data)
  },

  update(id: number, data: Partial<TaskAssignmentItemFormData>) {
    return apiClient.put<ApiResponse<TaskAssignmentItem>>(`/task-assignment-items/${id}`, {
      ...data,
      start_at: normalizeDate(data.start_at),
      end_at: normalizeDate(data.end_at),
    })
  },

  delete(id: number) {
    return apiClient.delete<ApiResponse>(`/task-assignment-items/${id}`)
  },

  stats(filters?: TaskAssignmentItemFilters) {
    return apiClient.get<ApiResponse<TaskAssignmentItemStats>>('/task-assignment-items/stats', { params: filters })
  },

  changeStatus(id: number, status: TaskAssignmentItemStatus) {
    return apiClient.patch<ApiResponse<TaskAssignmentItem>>(`/task-assignment-items/${id}/status`, { status })
  },

  bulkDelete(ids: number[]) {
    return apiClient.post<ApiResponse>('/task-assignment-items/bulk-delete', { ids })
  },

  bulkUpdateStatus(ids: number[], status: TaskAssignmentItemStatus) {
    return apiClient.patch<ApiResponse>('/task-assignment-items/bulk-status', { ids, status })
  },

  export(filters?: TaskAssignmentItemFilters) {
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

  statsByDepartment(filters?: TaskAssignmentItemFilters) {
    return apiClient.get<ApiResponse<StatsByDepartmentItem[]>>('/task-assignment-items/stats-by-department', { params: filters })
  },

  statsByUser(filters?: TaskAssignmentItemFilters) {
    return apiClient.get<ApiResponse<StatsByUserItem[]>>('/task-assignment-items/stats-by-user', { params: filters })
  },

  statsByTime(filters?: TaskAssignmentItemFilters & { group_by?: 'week' | 'month' | 'quarter' }) {
    return apiClient.get<ApiResponse<StatsByTimeItem[]>>('/task-assignment-items/stats-by-time', { params: filters })
  },

  overdue(filters?: TaskAssignmentItemFilters) {
    return apiClient.get<ApiResponse<TaskAssignmentItem[]>>('/task-assignment-items/overdue', { params: filters })
  },

  upcomingDeadline(filters?: TaskAssignmentItemFilters & { days?: number }) {
    return apiClient.get<ApiResponse<TaskAssignmentItem[]>>('/task-assignment-items/upcoming-deadline', { params: filters })
  },

  updateProgress(id: number, data: TaskAssignmentItemProgressData) {
    return apiClient.patch<ApiResponse<TaskAssignmentItem>>(`/task-assignment-items/${id}`, data)
  },

  getReports(id: number) {
    return apiClient.get<ApiResponse<TaskAssignmentItemReport[]>>(`/task-assignment-items/${id}/reports`)
  },

  createReport(id: number, data: TaskAssignmentItemReportFormData) {
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

    return apiClient.post<ApiResponse<TaskAssignmentItemReport>>(`/task-assignment-items/${id}/reports`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  updateReport(reportId: number, data: TaskAssignmentItemReportFormData) {
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

    return apiClient.post<ApiResponse<TaskAssignmentItemReport>>(`/task-assignment-item-reports/${reportId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
