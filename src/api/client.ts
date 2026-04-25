import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

import { useCookie } from '@/@core/utils/cookie'

// Global loading store (increment/decrement counter on requests)
// Use a lazy import inside interceptors to avoid circular startup issues

// Import global loading store

import { useGlobalLoadingStore } from '@/store/modules/global-loading'

// Base API URL - cấu hình theo environment
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api'

// Response format chuẩn từ Backend (RespondsWithJson)
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// Tạo Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request Interceptor - tự động thêm Bearer Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      useGlobalLoadingStore().startRequest()
    }
    catch {}

    const token = useCookie('accessToken').value

    if (token && config.headers)
      config.headers.Authorization = `Bearer ${token}`

    // Luôn thêm X-Organization-Id (Backend yêu cầu bắt buộc) mặc định là 1 => sau này mở rộng nhiều tổ chức
    const orgId = useCookie('organizationId').value || '1'
    if (config.headers)
      config.headers['X-Organization-Id'] = String(orgId)

    return config
  },
  error => {
    try {
      useGlobalLoadingStore().endRequest()
    }
    catch {}

    return Promise.reject(error)
  },
)

// Response Interceptor - xử lý lỗi tập trung
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // decrement global loading counter
    try {
      useGlobalLoadingStore().endRequest()
    }
    catch {}

    // Trả về data từ response.data.data (chuẩn Backend)
    return response
  },
  error => {
    // ensure we decrement
    try {
      useGlobalLoadingStore().endRequest()
    }
    catch {}

    // Xử lý lỗi 401 - chuyển về trang login (trừ khi đang ở login endpoint)
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      useCookie('accessToken').value = null
      useCookie('userData').value = null
      window.location.href = '/login'
    }

    // Xử lý lỗi 403 - không có quyền
    if (error.response?.status === 403)
      console.error('Access denied:', error.response.data.message)

    // Xử lý lỗi 422 - validation errors
    if (error.response?.status === 422) {
      const errors = error.response.data.errors || {}

      console.error('Validation errors:', errors)
    }

    return Promise.reject(error)
  },
)

export default apiClient
