import apiClient, { type ApiResponse } from '../client'

// Auth API endpoints
export const authApi = {
  // Đăng nhập
  login(credentials: { email: string; password: string }) {
    return apiClient.post<ApiResponse<{ user: any; token: string }>>('/auth/login', credentials)
  },

  // Đăng xuất
  logout() {
    return apiClient.post<ApiResponse>('/auth/logout')
  },

  // Lấy thông tin user hiện tại
  me() {
    return apiClient.get<ApiResponse<any>>('/user')
  },

  // Quên mật khẩu
  forgotPassword(email: string) {
    return apiClient.post<ApiResponse>('/auth/forgot-password', { email })
  },

  // Đặt lại mật khẩu
  resetPassword(data: { token: string; email: string; password: string; password_confirmation: string }) {
    return apiClient.post<ApiResponse>('/auth/reset-password', data)
  },

  // Chuyển đổi tổ chức
  switchOrganization(organizationId: number) {
    return apiClient.post<ApiResponse>('/auth/switch-organization', { organization_id: organizationId })
  },
}
