import apiClient, { type ApiResponse } from '../client'

export interface TaskAssignmentType {
  id: number
  name: string
  description?: string
  status: 'active' | 'inactive'
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface TaskAssignmentTypeStats {
  total: number
  active: number
  inactive: number
}

export interface TaskAssignmentTypeFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive'
  from_date?: string
  to_date?: string
  sort_by?: 'id' | 'name' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
}

export interface TaskAssignmentTypeFormData {
  name: string
  description?: string
  status?: 'active' | 'inactive'
}

export const taskAssignmentTypeApi = {
  list(filters?: TaskAssignmentTypeFilters) {
    return apiClient.get<ApiResponse<TaskAssignmentType[]>>('/task-assignment-types', { params: filters })
  },

  show(id: number) {
    return apiClient.get<ApiResponse<TaskAssignmentType>>(`/task-assignment-types/${id}`)
  },

  create(data: TaskAssignmentTypeFormData) {
    return apiClient.post<ApiResponse<TaskAssignmentType>>('/task-assignment-types', data)
  },

  update(id: number, data: Partial<TaskAssignmentTypeFormData>) {
    return apiClient.put<ApiResponse<TaskAssignmentType>>(`/task-assignment-types/${id}`, data)
  },

  delete(id: number) {
    return apiClient.delete<ApiResponse>(`/task-assignment-types/${id}`)
  },

  stats() {
    return apiClient.get<ApiResponse<TaskAssignmentTypeStats>>('/task-assignment-types/stats')
  },

  bulkDelete(ids: number[]) {
    return apiClient.post<ApiResponse>('/task-assignment-types/bulk-delete', { ids })
  },

  changeStatus(id: number, status: 'active' | 'inactive') {
    return apiClient.patch<ApiResponse<TaskAssignmentType>>(`/task-assignment-types/${id}/status`, { status })
  },

  bulkUpdateStatus(ids: number[], status: 'active' | 'inactive') {
    return apiClient.patch<ApiResponse>('/task-assignment-types/bulk-status', { ids, status })
  },

  export(filters?: TaskAssignmentTypeFilters) {
    return apiClient.get('/task-assignment-types/export', {
      params: filters,
      responseType: 'blob',
    })
  },

  downloadTemplate() {
    return apiClient.get('/task-assignment-types/import/template', {
      responseType: 'blob',
    })
  },

  import(file: File) {
    const formData = new FormData()

    formData.append('file', file)

    return apiClient.post<ApiResponse>('/task-assignment-types/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
