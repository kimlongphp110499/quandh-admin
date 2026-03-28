import apiClient, { type ApiResponse } from '../client'

export interface MeetingDocument {
  id: number
  meeting_id: number
  name: string
  type: string | null
  url: string
  file_type: string | null
  uploaded_by: string | null
  created_at: string
}

export const meetingDocumentApi = {
  // Danh sách tài liệu của cuộc họp
  list(meetingId: number) {
    return apiClient.get<ApiResponse<MeetingDocument[]>>(`/meetings/${meetingId}/documents`)
  },

  // Upload tài liệu (nhiều file)
  upload(meetingId: number, files: File[], name?: string, type?: string) {
    const formData = new FormData()

    files.forEach(file => formData.append('documents[]', file))
    if (name)
      formData.append('name', name)
    if (type)
      formData.append('type', type)

    return apiClient.post<ApiResponse<MeetingDocument[]>>(`/meetings/${meetingId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Xóa tài liệu
  delete(meetingId: number, documentId: number) {
    return apiClient.delete<ApiResponse>(`/meetings/${meetingId}/documents/${documentId}`)
  },

  // Preview tài liệu — trả về blob để hiển thị inline
  preview(meetingId: number, documentId: number) {
    return apiClient.get(`/meetings/${meetingId}/documents/${documentId}/preview`, {
      responseType: 'blob',
    })
  },
}
