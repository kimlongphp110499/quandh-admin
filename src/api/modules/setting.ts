import apiClient, { type ApiResponse } from '../client'

export type SettingsGroup = Record<string, any>
export type SettingsData = Record<string, SettingsGroup>

export const settingApi = {
  getAll() {
    return apiClient.get<ApiResponse<SettingsData>>('/settings')
  },

  getPublic() {
    return apiClient.get<ApiResponse<SettingsData>>('/settings/public')
  },

  get(key: string) {
    return apiClient.get<ApiResponse<{ key: string; value: any; group: string }>>(`/settings/${key}`)
  },

  update(data: Record<string, any>) {
    return apiClient.put<ApiResponse<SettingsData>>('/settings', data)
  },
}
