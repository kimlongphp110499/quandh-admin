import apiClient, { type ApiResponse } from '../client'

// Organization types
export interface Organization {
  id: number
  name: string
  slug: string
  description: string | null
  status: 'active' | 'inactive'
  parent_id: number | null
  sort_order: number
  depth: number
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  parent?: Organization | null
  children?: Organization[]
}

export interface OrganizationStats {
  total: number
  active: number
  inactive: number
}

export interface OrganizationFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive' | ''
  parent_id?: number | null
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface OrganizationFormData {
  name: string
  description?: string | null
  status: 'active' | 'inactive'
  parent_id?: number | null
  sort_order?: number
}

// Organization API endpoints
export const organizationApi = {
  // Danh sách (phân trang + lọc)
  list(filters?: OrganizationFilters) {
    return apiClient.get<ApiResponse<Organization[]>>('/organizations', { params: filters })
  },

  // Chi tiết
  show(id: number) {
    return apiClient.get<ApiResponse<Organization>>(`/organizations/${id}`)
  },

  // Tạo mới
  create(data: OrganizationFormData) {
    return apiClient.post<ApiResponse<Organization>>('/organizations', data)
  },

  // Cập nhật
  update(id: number, data: Partial<OrganizationFormData>) {
    return apiClient.put<ApiResponse<Organization>>(`/organizations/${id}`, data)
  },

  // Xóa
  delete(id: number) {
    return apiClient.delete<ApiResponse>(`/organizations/${id}`)
  },

  // Đổi trạng thái
  changeStatus(id: number, status: 'active' | 'inactive') {
    return apiClient.patch<ApiResponse<Organization>>(`/organizations/${id}/status`, { status })
  },

  // Xóa hàng loạt
  bulkDelete(ids: number[]) {
    return apiClient.post<ApiResponse>('/organizations/bulk-delete', { ids })
  },

  // Cập nhật trạng thái hàng loạt
  bulkStatus(ids: number[], status: 'active' | 'inactive') {
    return apiClient.patch<ApiResponse>('/organizations/bulk-status', { ids, status })
  },

  // Thống kê
  stats() {
    return apiClient.get<ApiResponse<OrganizationStats>>('/organizations/stats')
  },

  // Cây tổ chức
  tree() {
    return apiClient.get<ApiResponse<Organization[]>>('/organizations/tree')
  },

  // Options cho dropdown (public)
  publicOptions() {
    return apiClient.get<ApiResponse<{ id: number; name: string }[]>>('/organizations/public-options')
  },

  // Xuất Excel
  export(filters?: OrganizationFilters) {
    return apiClient.get('/organizations/export', {
      params: filters,
      responseType: 'blob',
    })
  },

  // Nhập từ file
  import(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.post<ApiResponse>('/organizations/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
