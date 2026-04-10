import apiClient, { type ApiResponse } from '../client'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { normalizeDate } from '@/utils/formatters'

export interface TaskAssignmentDocumentAttachment {
  id: number
  name: string
  url: string
  size?: number
  mime_type?: string
  sort_order?: number
}

export interface TaskAssignmentDocument {
  id: number
  name: string
  summary?: string
  issue_date?: string
  task_assignment_type_id?: number
  type?: { id: number; name: string }
  status: 'draft' | 'issued'
  issued_at?: string
  attachments?: TaskAssignmentDocumentAttachment[]
  items_count?: number
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface TaskAssignmentDocumentStats {
  total: number
  draft: number
  issued: number
}

export interface TaskAssignmentDocumentFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'draft' | 'issued'
  task_assignment_type_id?: number
  from_date?: string
  to_date?: string
  from_issue_date?: string
  to_issue_date?: string
  sort_by?: 'id' | 'name' | 'issue_date' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
}

export interface TaskAssignmentDocumentFormData {
  name: string
  summary?: string
  issue_date?: string
  task_assignment_type_id?: number | null
  status?: 'draft' | 'issued'
}

export const taskAssignmentDocumentApi = {
  list(filters?: TaskAssignmentDocumentFilters) {
    return apiClient.get<ApiResponse<TaskAssignmentDocument[]>>('/task-assignment-documents', { params: filters })
  },

  show(id: number) {
    return apiClient.get<ApiResponse<TaskAssignmentDocument>>(`/task-assignment-documents/${id}`)
  },

  create(data: TaskAssignmentDocumentFormData) {
    return apiClient.post<ApiResponse<TaskAssignmentDocument>>('/task-assignment-documents', {
      ...data,
      issue_date: normalizeDate(data.issue_date),
    })
  },

  update(id: number, data: Partial<TaskAssignmentDocumentFormData>) {
    return apiClient.put<ApiResponse<TaskAssignmentDocument>>(`/task-assignment-documents/${id}`, {
      ...data,
      issue_date: normalizeDate(data.issue_date),
    })
  },

  delete(id: number) {
    return apiClient.delete<ApiResponse>(`/task-assignment-documents/${id}`)
  },

  stats() {
    return apiClient.get<ApiResponse<TaskAssignmentDocumentStats>>('/task-assignment-documents/stats')
  },

  bulkDelete(ids: number[]) {
    return apiClient.post<ApiResponse>('/task-assignment-documents/bulk-delete', { ids })
  },

  changeStatus(id: number, status: 'draft' | 'issued') {
    return apiClient.patch<ApiResponse<TaskAssignmentDocument>>(`/task-assignment-documents/${id}/status`, { status })
  },

  bulkUpdateStatus(ids: number[], status: 'draft' | 'issued') {
    return apiClient.patch<ApiResponse>('/task-assignment-documents/bulk-status', { ids, status })
  },

  export(filters?: TaskAssignmentDocumentFilters) {
    return apiClient.get('/task-assignment-documents/export', {
      params: filters,
      responseType: 'blob',
    })
  },
  downloadTemplate() {
    return apiClient.get('/task-assignment-documents/import/template', {
      responseType: 'blob',
    })
  },
  import(file: File) {
    const formData = new FormData()

    formData.append('file', file)

    return apiClient.post<ApiResponse>('/task-assignment-documents/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  addAttachments(id: number, files: File[]) {
    const formData = new FormData()

    files.forEach(file => formData.append('attachments[]', file))

    return apiClient.post<ApiResponse<TaskAssignmentDocument>>(`/task-assignment-documents/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  removeAttachment(id: number, attachmentId: number) {
    return apiClient.delete<ApiResponse>(`/task-assignment-documents/${id}/attachments/${attachmentId}`)
  },
}
