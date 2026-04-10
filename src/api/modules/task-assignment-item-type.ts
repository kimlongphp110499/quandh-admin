import apiClient, { type ApiResponse } from '../client'

export interface TaskAssignmentItemType {
  id: number
  name: string
  description?: string
  status: 'active' | 'inactive'
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface TaskAssignmentItemTypeStats {
  total: number
  active: number
  inactive: number
}

export interface TaskAssignmentItemTypeFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive'
  from_date?: string
  to_date?: string
  sort_by?: 'id' | 'name' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
}

export interface TaskAssignmentItemTypeFormData {
  name: string
  description?: string
  status?: 'active' | 'inactive'
}

export const taskAssignmentItemTypeApi = {
  list(filters?: TaskAssignmentItemTypeFilters) {
    return apiClient.get<ApiResponse<TaskAssignmentItemType[]>>('/task-assignment-item-types', { params: filters })
  },

  show(id: number) {
    return apiClient.get<ApiResponse<TaskAssignmentItemType>>(`/task-assignment-item-types/${id}`)
  },

  create(data: TaskAssignmentItemTypeFormData) {
    return apiClient.post<ApiResponse<TaskAssignmentItemType>>('/task-assignment-item-types', data)
  },

  update(id: number, data: Partial<TaskAssignmentItemTypeFormData>) {
    return apiClient.put<ApiResponse<TaskAssignmentItemType>>(`/task-assignment-item-types/${id}`, data)
  },

  delete(id: number) {
    return apiClient.delete<ApiResponse>(`/task-assignment-item-types/${id}`)
  },

  stats() {
    return apiClient.get<ApiResponse<TaskAssignmentItemTypeStats>>('/task-assignment-item-types/stats')
  },

  bulkDelete(ids: number[]) {
    return apiClient.post<ApiResponse>('/task-assignment-item-types/bulk-delete', { ids })
  },

  changeStatus(id: number, status: 'active' | 'inactive') {
    return apiClient.patch<ApiResponse<TaskAssignmentItemType>>(`/task-assignment-item-types/${id}/status`, { status })
  },

  bulkUpdateStatus(ids: number[], status: 'active' | 'inactive') {
    return apiClient.patch<ApiResponse>('/task-assignment-item-types/bulk-status', { ids, status })
  },

  export(filters?: TaskAssignmentItemTypeFilters) {
    return apiClient.get('/task-assignment-item-types/export', {
      params: filters,
      responseType: 'blob',
    })
  },

  downloadTemplate() {
    return apiClient.get('/task-assignment-item-types/import/template', {
      responseType: 'blob',
    })
  },

  import(file: File) {
    const formData = new FormData()

    formData.append('file', file)

    return apiClient.post<ApiResponse>('/task-assignment-item-types/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
