import apiClient, { type ApiResponse } from '@/api/client'

import { normalizeDate } from '@/utils/formatters'

export interface DocumentAttachment {
  id: number
  name: string
  url: string
  size?: number
  mime_type?: string
  sort_order?: number
}

export interface Document {
  id: number
  name: string
  summary?: string
  issue_date?: string
  task_assignment_type_id?: number
  type?: { id: number; name: string }
  status: 'draft' | 'issued'
  issued_at?: string
  issued_by?: string | null
  attachments?: DocumentAttachment[]
  items_count?: number
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface DocumentStats {
  total: number
  draft: number
  issued: number
}

export interface DocumentStatsPeriodItem {
  label: string
  year: number
  period: number
  total: number
  draft: number
  issued: number
}

export interface DocumentStatsPeriodFilters {
  group_by: 'month' | 'quarter' | 'year'
  year?: number
  status?: 'draft' | 'issued'
  task_assignment_type_id?: number
}

export interface DocumentFilters {
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

export interface DocumentFormData {
  name: string
  summary?: string
  issue_date?: string
  task_assignment_type_id?: number | null
  status?: 'draft' | 'issued'
}

export const documentApi = {
  list(filters?: DocumentFilters) {
    return apiClient.get<ApiResponse<Document[]>>('/task-assignment-documents', { params: filters })
  },

  show(id: number) {
    return apiClient.get<ApiResponse<Document>>(`/task-assignment-documents/${id}`)
  },

  create(data: DocumentFormData) {
    return apiClient.post<ApiResponse<Document>>('/task-assignment-documents', {
      ...data,
      issue_date: normalizeDate(data.issue_date),
    })
  },

  update(id: number, data: Partial<DocumentFormData>) {
    return apiClient.put<ApiResponse<Document>>(`/task-assignment-documents/${id}`, {
      ...data,
      issue_date: normalizeDate(data.issue_date),
    })
  },

  delete(id: number) {
    return apiClient.delete<ApiResponse>(`/task-assignment-documents/${id}`)
  },

  stats() {
    return apiClient.get<ApiResponse<DocumentStats>>('/task-assignment-documents/stats')
  },

  statsPeriod(filters: DocumentStatsPeriodFilters) {
    return apiClient.get<ApiResponse<DocumentStatsPeriodItem[]>>('/task-assignment-documents/stats/period', { params: filters })
  },

  bulkDelete(ids: number[]) {
    return apiClient.post<ApiResponse>('/task-assignment-documents/bulk-delete', { ids })
  },

  changeStatus(id: number, status: 'draft' | 'issued') {
    return apiClient.patch<ApiResponse<Document>>(`/task-assignment-documents/${id}/status`, { status })
  },

  bulkUpdateStatus(ids: number[], status: 'draft' | 'issued') {
    return apiClient.patch<ApiResponse>('/task-assignment-documents/bulk-status', { ids, status })
  },

  export(filters?: DocumentFilters) {
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

    files.forEach(file => formData.append('files[]', file))

    return apiClient.post<ApiResponse<Document>>(`/task-assignment-documents/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  removeAttachment(id: number, attachmentId: number) {
    return apiClient.delete<ApiResponse>(`/task-assignment-documents/${id}/attachments/${attachmentId}`)
  },
}
