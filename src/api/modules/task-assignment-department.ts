import apiClient, { type ApiResponse } from '../client'

export interface TaskAssignmentDepartment {
  id: number
  code: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  sort_order: number
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface TaskAssignmentDepartmentStats {
  total: number
  active: number
  inactive: number
}

export interface TaskAssignmentDepartmentFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive'
  from_date?: string
  to_date?: string
  sort_by?: 'id' | 'code' | 'name' | 'sort_order' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
}

export interface TaskAssignmentDepartmentFormData {
  code: string
  name: string
  description?: string
  status?: 'active' | 'inactive'
  sort_order?: number
}

export const taskAssignmentDepartmentApi = {
  list(filters?: TaskAssignmentDepartmentFilters) {
    return apiClient.get<ApiResponse<TaskAssignmentDepartment[]>>('/task-assignment-departments', { params: filters })
  },

  show(id: number) {
    return apiClient.get<ApiResponse<TaskAssignmentDepartment>>(`/task-assignment-departments/${id}`)
  },

  create(data: TaskAssignmentDepartmentFormData) {
    return apiClient.post<ApiResponse<TaskAssignmentDepartment>>('/task-assignment-departments', data)
  },

  update(id: number, data: Partial<TaskAssignmentDepartmentFormData>) {
    return apiClient.put<ApiResponse<TaskAssignmentDepartment>>(`/task-assignment-departments/${id}`, data)
  },

  delete(id: number) {
    return apiClient.delete<ApiResponse>(`/task-assignment-departments/${id}`)
  },

  stats() {
    return apiClient.get<ApiResponse<TaskAssignmentDepartmentStats>>('/task-assignment-departments/stats')
  },

  bulkDelete(ids: number[]) {
    return apiClient.post<ApiResponse>('/task-assignment-departments/bulk-delete', { ids })
  },

  bulkUpdateStatus(ids: number[], status: 'active' | 'inactive') {
    return apiClient.patch<ApiResponse>('/task-assignment-departments/bulk-status', { ids, status })
  },

  export(filters?: TaskAssignmentDepartmentFilters) {
    return apiClient.get('/task-assignment-departments/export', {
      params: filters,
      responseType: 'blob',
    })
  },

  import(file: File) {
    const formData = new FormData()

    formData.append('file', file)

    return apiClient.post<ApiResponse>('/task-assignment-departments/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
