import apiClient, { type ApiResponse } from '@/api/client'

// ── Types ─────────────────────────────────────────────────────────

export type UserStatus = 'active' | 'inactive'


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

// ── API ───────────────────────────────────────────────────────────

export const userApi = {
  list: (filters?: UserFilters) =>
    apiClient.get<ApiResponse<User[]>>('/users', { params: filters }),

  show: (id: number) =>
    apiClient.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: UserFormData) =>
    apiClient.post<ApiResponse<User>>('/users', data),

  update: (id: number, data: Partial<UserFormData>) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse>(`/users/${id}`),

  changeStatus: (id: number, status: UserStatus) =>
    apiClient.patch<ApiResponse<User>>(`/users/${id}/status`, { status }),

  stats: () =>
    apiClient.get<ApiResponse<UserStats>>('/users/stats'),

  bulkDelete: (ids: number[]) =>
    apiClient.post<ApiResponse>('/users/bulk-delete', { ids }),

  bulkStatus: (ids: number[], status: UserStatus) =>
    apiClient.patch<ApiResponse>('/users/bulk-status', { ids, status }),

  export: (filters?: UserFilters) =>
    apiClient.get('/users/export', { params: filters, responseType: 'blob' }),

  resetPassword: (id: number, data: { password: string; password_confirmation: string }) =>
    apiClient.post<ApiResponse>(`/users/${id}/reset-password`, data),

  import: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<ApiResponse>('/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
