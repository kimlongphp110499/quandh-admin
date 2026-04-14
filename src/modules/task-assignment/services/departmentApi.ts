// eslint-disable-next-line import/extensions, import/no-unresolved
import apiClient, { type ApiResponse } from '@/api/client'

export interface Department {
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

export interface DepartmentStats {
  total: number
  active: number
  inactive: number
}

export interface DepartmentFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive'
  from_date?: string
  to_date?: string
  sort_by?: 'id' | 'code' | 'name' | 'sort_order' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
}

export interface DepartmentFormData {
  code: string
  name: string
  description?: string
  status?: 'active' | 'inactive'
  sort_order?: number
}

export const departmentApi = {
  list(filters?: DepartmentFilters) {
    return apiClient.get<ApiResponse<Department[]>>('/task-assignment-departments', { params: filters })
  },

  show(id: number) {
    return apiClient.get<ApiResponse<Department>>(`/task-assignment-departments/${id}`)
  },

  create(data: DepartmentFormData) {
    return apiClient.post<ApiResponse<Department>>('/task-assignment-departments', data)
  },

  update(id: number, data: Partial<DepartmentFormData>) {
    return apiClient.put<ApiResponse<Department>>(`/task-assignment-departments/${id}`, data)
  },

  delete(id: number) {
    return apiClient.delete<ApiResponse>(`/task-assignment-departments/${id}`)
  },

  stats() {
    return apiClient.get<ApiResponse<DepartmentStats>>('/task-assignment-departments/stats')
  },

  bulkDelete(ids: number[]) {
    return apiClient.post<ApiResponse>('/task-assignment-departments/bulk-delete', { ids })
  },

  // Đổi trạng thái
  changeStatus(id: number, status: 'active' | 'inactive') {
    return apiClient.patch<ApiResponse<Department>>(`/task-assignment-departments/${id}/status`, { status })
  },

  bulkUpdateStatus(ids: number[], status: 'active' | 'inactive') {
    return apiClient.patch<ApiResponse>('/task-assignment-departments/bulk-status', { ids, status })
  },

  export(filters?: DepartmentFilters) {
    return apiClient.get('/task-assignment-departments/export', {
      params: filters,
      responseType: 'blob',
    })
  },

  downloadTemplate() {
    return apiClient.get('/task-assignment-departments/import/template', {
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
