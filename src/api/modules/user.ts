import apiClient, { type ApiResponse } from '../client'

// User types
export type UserStatus = 'active' | 'inactive' | 'banned'

export interface UserAssignment {
  role_id: number
  role_name?: string | null
  organization_ids: number[]
  organizations?: { id: number; name?: string | null }[]
}

export interface User {
  id: number
  name: string
  email: string
  user_name: string
  status: UserStatus
  created_by: string | null
  updated_by: string | null
  assignments: UserAssignment[]
  created_at: string
  updated_at: string
}

export interface UserStats {
  total: number
  active: number
  inactive: number
}

export interface UserFilters {
  page?: number
  limit?: number
  search?: string
  status?: UserStatus | ''
  organization_id?: number | null
  from_date?: string
  to_date?: string
  sort_by?: 'id' | 'name' | 'email' | 'user_name' | 'created_at'
  sort_order?: 'asc' | 'desc'
}

export interface UserFormData {
  name: string
  email: string
  user_name?: string
  password?: string
  password_confirmation?: string
  status?: UserStatus
  assignments?: { role_id: number; organization_ids: number[] }[]
}

// User API endpoints
export const userApi = {
  // Danh sách
  list(filters?: UserFilters) {
    return apiClient.get<ApiResponse<User[]>>('/users', { params: filters })
  },

  // Chi tiết
  show(id: number) {
    return apiClient.get<ApiResponse<User>>(`/users/${id}`)
  },

  // Tạo mới
  create(data: UserFormData) {
    return apiClient.post<ApiResponse<User>>('/users', data)
  },

  // Cập nhật
  update(id: number, data: Partial<UserFormData>) {
    return apiClient.put<ApiResponse<User>>(`/users/${id}`, data)
  },

  // Xóa
  delete(id: number) {
    return apiClient.delete<ApiResponse>(`/users/${id}`)
  },

  // Đổi trạng thái
  changeStatus(id: number, status: UserStatus) {
    return apiClient.patch<ApiResponse<User>>(`/users/${id}/status`, { status })
  },

  // Thống kê
  stats() {
    return apiClient.get<ApiResponse<UserStats>>('/users/stats')
  },

  // Xóa hàng loạt
  bulkDelete(ids: number[]) {
    return apiClient.post<ApiResponse>('/users/bulk-delete', { ids })
  },

  // Cập nhật trạng thái hàng loạt
  bulkStatus(ids: number[], status: UserStatus) {
    return apiClient.patch<ApiResponse>('/users/bulk-status', { ids, status })
  },

  // Xuất Excel
  export(filters?: UserFilters) {
    return apiClient.get('/users/export', {
      params: filters,
      responseType: 'blob',
    })
  },

  // Đặt lại mật khẩu
  resetPassword(id: number, data: { password: string; password_confirmation: string }) {
    return apiClient.post<ApiResponse>(`/users/${id}/reset-password`, data)
  },

  // Nhập từ file
  import(file: File) {
    const formData = new FormData()

    formData.append('file', file)

    return apiClient.post<ApiResponse>('/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
