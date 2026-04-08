import apiClient, { type ApiResponse } from '../client'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

export interface ActivityLog {
  id: number
  description: string
  user_type: string
  user_id: number | null
  user_name: string
  organization_id: number | null
  route: string
  method_type: string
  status_code: number
  ip_address: string
  country: string
  user_agent: string
  request_data: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface ActivityLogFilters {
  page?: number
  limit?: number
  search?: string
  from_date?: string
  to_date?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  method_type?: string
  status_code?: number | null
}

function normalizeDate(raw?: string): string | undefined {
  if (!raw)
    return raw

  if (dayjs(raw, 'DD/MM/YYYY', true).isValid())
    return dayjs(raw, 'DD/MM/YYYY').format('YYYY-MM-DD')

  if (dayjs(raw, 'DD/MM/YYYY HH:mm:ss', true).isValid())
    return dayjs(raw, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')

  return raw
}

export const activityLogApi = {
  list(filters?: ActivityLogFilters) {
    return apiClient.get<ApiResponse<ActivityLog[]>>('/log-activities', {
      params: {
        ...filters,
        from_date: normalizeDate(filters?.from_date),
        to_date: normalizeDate(filters?.to_date),
      },
    })
  },

  show(id: number) {
    return apiClient.get<ApiResponse<ActivityLog>>(`/log-activities/${id}`)
  },

  delete(id: number) {
    return apiClient.delete<ApiResponse>(`/log-activities/${id}`)
  },

  bulkDelete(ids: number[]) {
    return apiClient.post<ApiResponse>('/log-activities/bulk-delete', { ids })
  },

  // eslint-disable-next-line camelcase
  deleteByDate(from_date: string, to_date: string) {
    return apiClient.post<ApiResponse>('/log-activities/delete-by-date', {
      from_date: normalizeDate(from_date),
      to_date: normalizeDate(to_date),
    })
  },

  clear() {
    return apiClient.post<ApiResponse>('/log-activities/clear')
  },

  stats(filters?: ActivityLogFilters) {
    return apiClient.get<ApiResponse<{ total: number }>>('/log-activities/stats', {
      params: {
        ...filters,
        from_date: normalizeDate(filters?.from_date),
        to_date: normalizeDate(filters?.to_date),
      },
    })
  },

  export(filters?: ActivityLogFilters) {
    return apiClient.get('/log-activities/export', {
      params: {
        ...filters,
        from_date: normalizeDate(filters?.from_date),
        to_date: normalizeDate(filters?.to_date),
      },
      responseType: 'blob',
    })
  },
}