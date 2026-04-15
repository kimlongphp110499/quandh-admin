// eslint-disable-next-line import/extensions, import/no-unresolved
import apiClient, { type ApiResponse } from '@/api/client'

export interface ItemType {
  id: number
  name: string
  description?: string
  status: 'active' | 'inactive'
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface ItemTypeStats {
  total: number
  active: number
  inactive: number
}

export interface ItemTypeFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive'
  from_date?: string
  to_date?: string
  sort_by?: 'id' | 'name' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
}

export interface ItemTypeFormData {
  name: string
  description?: string
  status?: 'active' | 'inactive'
}

export const taskAssignmentItemTypeApi = {
  list(filters?: ItemTypeFilters) {
    return apiClient.get<ApiResponse<ItemType[]>>('/task-assignment-item-types', { params: filters })
  },

  show(id: number) {
    return apiClient.get<ApiResponse<ItemType>>(`/task-assignment-item-types/${id}`)
  },

  create(data: ItemTypeFormData) {
    return apiClient.post<ApiResponse<ItemType>>('/task-assignment-item-types', data)
  },

  update(id: number, data: Partial<ItemTypeFormData>) {
    return apiClient.put<ApiResponse<ItemType>>(`/task-assignment-item-types/${id}`, data)
  },

  delete(id: number) {
    return apiClient.delete<ApiResponse>(`/task-assignment-item-types/${id}`)
  },

  stats() {
    return apiClient.get<ApiResponse<ItemTypeStats>>('/task-assignment-item-types/stats')
  },

  bulkDelete(ids: number[]) {
    return apiClient.post<ApiResponse>('/task-assignment-item-types/bulk-delete', { ids })
  },

  changeStatus(id: number, status: 'active' | 'inactive') {
    return apiClient.patch<ApiResponse<ItemType>>(`/task-assignment-item-types/${id}/status`, { status })
  },

  bulkUpdateStatus(ids: number[], status: 'active' | 'inactive') {
    return apiClient.patch<ApiResponse>('/task-assignment-item-types/bulk-status', { ids, status })
  },

  export(filters?: ItemTypeFilters) {
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
