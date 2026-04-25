import apiClient, { type ApiResponse } from '@/api/client'

import { normalizeDate } from '@/utils/formatters'

export type MyTaskStatus = 'todo' | 'in_progress' | 'done' | 'overdue' | 'paused' | 'cancelled'
export type MyTaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type MyTaskDeadlineAlertColor = 'red' | 'yellow' | 'green' | null

export interface MyTaskAssignment {
  assignment_role: 'main' | 'support'
  assignment_status: 'assigned' | 'accepted' | 'rejected' | 'done'
  assigned_at?: string
  accepted_at?: string
  completed_at?: string
  note?: string
}

export interface MyTaskDepartment {
  id: number
  code: string
  name: string
  role: 'main' | 'cooperate'
}

export interface MyTaskUser {
  id: number
  name: string
  department_id: number
  assignment_role: 'main' | 'support'
  assignment_status: 'assigned' | 'accepted' | 'rejected' | 'done'
}

export interface MyTaskItem {
  id: number
  task_assignment_document_id: number
  document?: { id: number; name: string; issue_date?: string; type?: string }
  name: string
  description?: string
  item_type?: string
  deadline_type: 'has_deadline' | 'no_deadline'
  start_at?: string
  end_at?: string
  processing_status: MyTaskStatus
  completion_percent: number
  priority?: MyTaskPriority
  completed_at?: string
  days_remaining?: number | null
  deadline_alert_color?: MyTaskDeadlineAlertColor
  departments?: MyTaskDepartment[]
  users?: MyTaskUser[]
  my_assignment?: MyTaskAssignment | null
  created_at: string
  updated_at: string
}

export interface MyTaskStats {
  total: number
  todo: number
  in_progress: number
  done: number
  overdue: number
  paused: number
  cancelled: number
}

export interface MyTaskFilters {
  page?: number
  limit?: number
  search?: string
  processing_status?: MyTaskStatus
  priority?: MyTaskPriority
  department_id?: number
  start_from?: string
  start_to?: string
  end_from?: string
  end_to?: string
  sort_by?: 'id' | 'end_at' | 'priority' | 'completion_percent' | 'created_at'
  sort_order?: 'asc' | 'desc'
}

export interface MyTaskProgressData {
  processing_status?: Exclude<MyTaskStatus, 'overdue'>
  completion_percent?: number
  note?: string
}

export interface MyTaskReportAttachment {
  id: number
  file_name: string
  url?: string
  mime_type?: string
  size?: number
}

export interface MyTaskReport {
  id: number
  task_assignment_item_id: number
  reporter_user_id: number
  reporter_name?: string
  completed_at?: string
  report_document_number?: string
  report_document_excerpt?: string
  report_document_content?: string
  attachments?: MyTaskReportAttachment[]
  created_at: string
  updated_at: string
}

export interface MyTaskProgressHistory {
  id: number
  task_assignment_item_id: number
  user_id: number
  user_name?: string
  old_processing_status?: MyTaskStatus
  new_processing_status?: MyTaskStatus
  old_completion_percent?: number
  new_completion_percent?: number
  note?: string
  created_at: string
}

export interface MyTaskReportFormData {
  completed_at?: string
  report_document_number?: string
  report_document_excerpt?: string
  report_document_content?: string
  files?: File[]
  remove_attachment_ids?: number[]
}

export const myTaskAssignmentItemApi = {
  /** Thống kê công việc của tôi */
  stats(filters?: Omit<MyTaskFilters, 'page' | 'limit'>) {
    return apiClient.get<ApiResponse<MyTaskStats>>('/my-task-assignment-items/stats', { params: filters })
  },

  /** Danh sách công việc của tôi (phân trang) */
  list(filters?: MyTaskFilters) {
    return apiClient.get<ApiResponse<MyTaskItem[]>>('/my-task-assignment-items', { params: filters })
  },

  /** Chi tiết công việc của tôi */
  show(id: number) {
    return apiClient.get<ApiResponse<MyTaskItem>>(`/my-task-assignment-items/${id}`)
  },

  /** Cập nhật tiến độ công việc của tôi */
  updateProgress(id: number, data: MyTaskProgressData) {
    return apiClient.patch<ApiResponse<MyTaskItem>>(`/my-task-assignment-items/${id}/progress`, data)
  },

  /** Lịch sử cập nhật tiến độ công việc của tôi */
  getProgressHistory(id: number) {
    return apiClient.get<ApiResponse<MyTaskProgressHistory[]>>(`/my-task-assignment-items/${id}/progress-history`)
  },

  /** Lấy danh sách báo cáo của công việc */
  getReports(id: number, params?: { only_mine?: boolean }) {
    return apiClient.get<ApiResponse<MyTaskReport[]>>(`/task-assignment-items/${id}/reports`, { params })
  },

  /** Nộp báo cáo mới */
  createReport(id: number, data: MyTaskReportFormData) {
    const formData = new FormData()

    if (data.completed_at)
      formData.append('completed_at', normalizeDate(data.completed_at) ?? data.completed_at)
    if (data.report_document_number)
      formData.append('report_document_number', data.report_document_number)
    if (data.report_document_excerpt)
      formData.append('report_document_excerpt', data.report_document_excerpt)
    if (data.report_document_content)
      formData.append('report_document_content', data.report_document_content)
    if (data.files)
      data.files.forEach(f => formData.append('files[]', f))

    return apiClient.post<ApiResponse<MyTaskReport>>(`/task-assignment-items/${id}/reports`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /** Chỉnh sửa báo cáo */
  updateReport(reportId: number, data: MyTaskReportFormData) {
    const formData = new FormData()

    formData.append('_method', 'PATCH')
    if (data.completed_at)
      formData.append('completed_at', normalizeDate(data.completed_at) ?? data.completed_at)
    if (data.report_document_number)
      formData.append('report_document_number', data.report_document_number)
    if (data.report_document_excerpt)
      formData.append('report_document_excerpt', data.report_document_excerpt)
    if (data.report_document_content)
      formData.append('report_document_content', data.report_document_content)
    if (data.files)
      data.files.forEach(f => formData.append('files[]', f))
    if (data.remove_attachment_ids?.length)
      data.remove_attachment_ids.forEach(id => formData.append('remove_attachment_ids[]', String(id)))

    return apiClient.post<ApiResponse<MyTaskReport>>(`/task-assignment-item-reports/${reportId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
