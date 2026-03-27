import apiClient, { type ApiResponse } from '../client'

// Meeting types
export interface Meeting {
  id: number
  title: string
  description: string | null
  location: string | null
  start_at: string
  end_at: string
  status: 'draft' | 'in_progress' | 'active' | 'ended'
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface MeetingFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  from_date?: string
  to_date?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// Meeting API endpoints
export const meetingApi = {
  // Thống kê cuộc họp
  stats(filters?: MeetingFilters) {
    return apiClient.get<ApiResponse<any>>('/meetings/stats', { params: filters })
  },

  // Danh sách cuộc họp
  list(filters?: MeetingFilters) {
    return apiClient.get<ApiResponse<Meeting[]>>('/meetings', { params: filters })
  },

  // Chi tiết cuộc họp
  show(id: number) {
    return apiClient.get<ApiResponse<Meeting>>(`/meetings/${id}`)
  },

  // Tạo cuộc họp
  create(data: Partial<Meeting>) {
    return apiClient.post<ApiResponse<Meeting>>('/meetings', data)
  },

  // Cập nhật cuộc họp
  update(id: number, data: Partial<Meeting>) {
    return apiClient.put<ApiResponse<Meeting>>(`/meetings/${id}`, data)
  },

  // Xóa cuộc họp
  delete(id: number) {
    return apiClient.delete<ApiResponse>(`/meetings/${id}`)
  },

  // Thay đổi trạng thái
  changeStatus(id: number, status: Meeting['status']) {
    return apiClient.patch<ApiResponse<Meeting>>(`/meetings/${id}/status`, { status })
  },

  // Xóa hàng loạt
  bulkDelete(ids: number[]) {
    return apiClient.post<ApiResponse>('/meetings/bulk-delete', { ids })
  },

  // Cập nhật trạng thái hàng loạt
  bulkUpdateStatus(ids: number[], status: Meeting['status']) {
    return apiClient.patch<ApiResponse>('/meetings/bulk-status', { ids, status })
  },

  // Xuất danh sách
  export(filters?: MeetingFilters) {
    return apiClient.get('/meetings/export', { 
      params: filters,
      responseType: 'blob',
    })
  },

  // Nhập danh sách
  import(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.post<ApiResponse>('/meetings/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
