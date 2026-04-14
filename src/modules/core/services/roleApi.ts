// eslint-disable-next-line import/extensions, import/no-unresolved
import apiClient, { type ApiResponse } from '@/api/client'

export interface Role {
  id: number
  name: string
  guard_name: string
  organization_id?: number | null
  organization?: { id: number; name: string } | null
  permissions?: string[]
  users_count?: number
  created_at: string
  updated_at: string
}

export interface RoleStats {
  total: number
}

export interface RoleFilters {
  page?: number
  limit?: number
  search?: string
  sort_by?: 'id' | 'name' | 'created_at'
  sort_order?: 'asc' | 'desc'
}

export interface RoleFormData {
  name: string
  guard_name?: string
  permission_ids?: number[]
}

export const roleApi = {
  list(filters?: RoleFilters) {
    return apiClient.get<ApiResponse<Role[]>>('/roles', { params: filters })
  },

  show(id: number) {
    return apiClient.get<ApiResponse<Role>>(`/roles/${id}`)
  },

  create(data: RoleFormData) {
    return apiClient.post<ApiResponse<Role>>('/roles', data)
  },

  update(id: number, data: Partial<RoleFormData>) {
    return apiClient.put<ApiResponse<Role>>(`/roles/${id}`, data)
  },

  delete(id: number) {
    return apiClient.delete<ApiResponse>(`/roles/${id}`)
  },

  stats() {
    return apiClient.get<ApiResponse<RoleStats>>('/roles/stats')
  },

  bulkDelete(ids: number[]) {
    return apiClient.post<ApiResponse>('/roles/bulk-delete', { ids })
  },

  export(filters?: RoleFilters) {
    return apiClient.get('/roles/export', {
      params: filters,
      responseType: 'blob',
    })
  },

  import(file: File) {
    const formData = new FormData()

    formData.append('file', file)

    return apiClient.post<ApiResponse>('/roles/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
