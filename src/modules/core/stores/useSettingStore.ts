import { defineStore } from 'pinia'
import { ref } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { type SettingsData, settingApi } from '../services/settingApi'

export const useSettingStore = defineStore('setting', () => {
  const settings = ref<SettingsData>({})
  const isLoading = ref(false)
  const isSaving = ref(false)

  async function fetchSettings() {
    isLoading.value = true
    try {
      const res = await settingApi.getAll()

      settings.value = res.data.data ?? {}
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchPublicSettings() {
    try {
      const res = await settingApi.getPublic()

      settings.value = res.data.data ?? {}
    }
    catch {
      // silently fail on public page
    }
  }

  async function updateSettings(data: Record<string, any>) {
    isSaving.value = true
    try {
      const res = await settingApi.update(data)
      if (res.data.data)
        settings.value = res.data.data
    }
    finally {
      isSaving.value = false
    }
  }

  function get(group: string, key: string, fallback: any = '') {
    return settings.value[group]?.[key] ?? fallback
  }

  return {
    settings,
    isLoading,
    isSaving,
    fetchSettings,
    fetchPublicSettings,
    updateSettings,
    get,
  }
})
