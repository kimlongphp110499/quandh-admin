import apiClient, { type ApiResponse } from '../client'

export interface User {
  id: number
  name: string
  email: string
  user_name: string | null
  status: string
}

export interface Participant {
  id: number
  meeting_id: number
  user_id: number
  user_name: string | null
  user_email: string | null
  position: string
  meeting_role: 'chair' | 'secretary' | 'delegate'
  attendance_status: 'not_arrived' | 'present' | 'absent'
  checkin_at: string | null
  absence_reason: string | null
  created_at: string
}

export const MEETING_ROLE_OPTIONS = [
  { title: 'Chủ trì', value: 'chair' },
  { title: 'Thư ký', value: 'secretary' },
  { title: 'Đại biểu', value: 'delegate' },
] as const

export const ATTENDANCE_STATUS_OPTIONS = [
  { title: 'Chưa đến', value: 'not_arrived' },
  { title: 'Có mặt', value: 'present' },
  { title: 'Vắng mặt', value: 'absent' },
] as const

export const participantApi = {
  list(meetingId: number, params?: { search?: string }) {
    return apiClient.get<ApiResponse<Participant[]>>(`/meetings/${meetingId}/participants`, { params })
  },

  store(meetingId: number, data: { user_ids: number[]; meeting_role: string; position: string }) {
    return apiClient.post<ApiResponse<Participant[]>>(`/meetings/${meetingId}/participants`, data)
  },

  update(meetingId: number, participantId: number, data: { meeting_role?: string; position?: string }) {
    return apiClient.put<ApiResponse<Participant>>(`/meetings/${meetingId}/participants/${participantId}`, data)
  },

  delete(meetingId: number, participantId: number) {
    return apiClient.delete<ApiResponse>(`/meetings/${meetingId}/participants/${participantId}`)
  },

  bulkDelete(meetingId: number, ids: number[]) {
    return apiClient.post<ApiResponse>(`/meetings/${meetingId}/participants/bulk-delete`, { ids })
  },

  // Điểm danh lần đầu (chỉ khi trạng thái là not_arrived)
  checkin(meetingId: number, participantId: number, data: { attendance_status: string; absence_reason?: string | null }) {
    return apiClient.patch<ApiResponse<Participant>>(`/meetings/${meetingId}/participants/${participantId}/checkin`, data)
  },

  // Cập nhật trạng thái điểm danh (admin override, không bị ràng buộc)
  changeStatus(meetingId: number, participantId: number, data: { attendance_status: string; absence_reason?: string | null }) {
    return apiClient.patch<ApiResponse<Participant>>(`/meetings/${meetingId}/participants/${participantId}/status`, data)
  },

  // Cập nhật trạng thái hàng loạt
  bulkUpdateStatus(meetingId: number, ids: number[], attendanceStatus: string) {
    return apiClient.patch<ApiResponse>(`/meetings/${meetingId}/participants/bulk-status`, { ids, attendanceStatus })
  },
}

export const userSearchApi = {
  search(params: { search?: string; limit?: number; status?: string }) {
    return apiClient.get<ApiResponse<User[]>>('/users', { params })
  },
}
