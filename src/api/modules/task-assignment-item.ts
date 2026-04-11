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

  overdue(filters?: TaskAssignmentItemFilters) {
    return apiClient.get<ApiResponse<TaskAssignmentItem[]>>('/task-assignment-items/overdue', { params: filters })
  },

  upcomingDeadline(filters?: TaskAssignmentItemFilters & { days?: number }) {
    return apiClient.get<ApiResponse<TaskAssignmentItem[]>>('/task-assignment-items/upcoming-deadline', { params: filters })
  },
}
