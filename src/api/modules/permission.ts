import apiClient, { type ApiResponse } from '../client'

export interface Permission {
  id: number
  name: string
  guard_name: string
  description?: string | null
  sort_order?: number
  parent_id?: number | null
  parent?: { id: number; name: string } | null
  children?: Permission[]
  roles?: { id: number; name: string }[]
  created_at: string
  updated_at: string
}

export interface PermissionStats {
  total: number
  groups: number
}

export interface PermissionFilters {
  page?: number
  limit?: number
  search?: string
  parent_id?: number | null
  sort_by?: 'id' | 'name' | 'sort_order' | 'created_at'
  sort_order?: 'asc' | 'desc'
}

export interface PermissionFormData {
  name: string
  guard_name?: string
  description?: string | null
  sort_order?: number
  parent_id?: number | null
}

export const permissionApi = {
  list(filters?: PermissionFilters) {
    return apiClient.get<ApiResponse<Permission[]>>('/permissions', { params: filters })
  },

  show(id: number) {
    return apiClient.get<ApiResponse<Permission>>(`/permissions/${id}`)
  },

  create(data: PermissionFormData) {
    return apiClient.post<ApiResponse<Permission>>('/permissions', data)
  },

  update(id: number, data: Partial<PermissionFormData>) {
    return apiClient.put<ApiResponse<Permission>>(`/permissions/${id}`, data)
  },

  delete(id: number) {
    return apiClient.delete<ApiResponse>(`/permissions/${id}`)
  },

  stats() {
    return apiClient.get<ApiResponse<PermissionStats>>('/permissions/stats')
  },

  tree(params?: { with_roles?: boolean }) {
    return apiClient.get<ApiResponse<Permission[]>>('/permissions/tree', { params })
  },

  bulkDelete(ids: number[]) {
    return apiClient.post<ApiResponse>('/permissions/bulk-delete', { ids })
  },

  export(filters?: PermissionFilters) {
    return apiClient.get('/permissions/export', {
      params: filters,
      responseType: 'blob',
    })
  },

  import(file: File) {
    const formData = new FormData()

    formData.append('file', file)

    return apiClient.post<ApiResponse>('/permissions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
