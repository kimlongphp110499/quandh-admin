import apiClient, { type ApiResponse } from '../client'

export interface Agenda {
  id: number
  meeting_id: number
  title: string
  description: string | null
  order_index: number
  duration: number | null
  is_current: boolean
  created_at: string
  updated_at: string
}

export interface AgendaReorderItem {
  id: number
  order_index: number
}

export const agendaApi = {
  // Danh sách chương trình theo cuộc họp
  list(meetingId: number) {
    return apiClient.get<ApiResponse<Agenda[]>>(`/meetings/${meetingId}/agendas`)
  },

  // Tạo mục chương trình
  create(meetingId: number, data: Partial<Agenda>) {
    return apiClient.post<ApiResponse<Agenda>>(`/meetings/${meetingId}/agendas`, data)
  },

  // Cập nhật mục chương trình
  update(meetingId: number, agendaId: number, data: Partial<Agenda>) {
    return apiClient.put<ApiResponse<Agenda>>(`/meetings/${meetingId}/agendas/${agendaId}`, data)
  },

  // Xóa mục chương trình
  delete(meetingId: number, agendaId: number) {
    return apiClient.delete<ApiResponse>(`/meetings/${meetingId}/agendas/${agendaId}`)
  },

  // Đặt mục hiện tại đang diễn ra
  setCurrent(meetingId: number, agendaId: number) {
    return apiClient.post<ApiResponse<Agenda>>(`/meetings/${meetingId}/agendas/${agendaId}/set-current`)
  },

  // Sắp xếp lại thứ tự
  reorder(meetingId: number, orders: AgendaReorderItem[]) {
    return apiClient.post<ApiResponse>(`/meetings/${meetingId}/agendas/reorder`, { orders })
  },
}
