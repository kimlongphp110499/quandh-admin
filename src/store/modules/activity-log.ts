import { defineStore } from 'pinia'
import { ref } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { type ActivityLog, type ActivityLogFilters, activityLogApi } from '@/api/modules/activity-log'

export const useActivityLogStore = defineStore('activityLog', () => {
  const logs = ref<ActivityLog[]>([])
  const currentLog = ref<ActivityLog | null>(null)
  const isLoading = ref(false)
  const total = ref(0)
  const meta = ref<any>(null)

  const filters = ref<ActivityLogFilters>({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  async function fetchLogs(customFilters?: ActivityLogFilters) {
    isLoading.value = true
    try {
      const res = await activityLogApi.list({ ...filters.value, ...customFilters })
      if (res.data.success) {
        logs.value = res.data.data ?? []
        meta.value = res.data.meta
        total.value = res.data.meta?.total ?? 0
      }
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchLog(id: number) {
    const res = await activityLogApi.show(id)
    if (res.data.success && res.data.data)
      currentLog.value = res.data.data
  }

  async function deleteLog(id: number) {
    await activityLogApi.delete(id)
    logs.value = logs.value.filter(l => l.id !== id)
    total.value = Math.max(0, total.value - 1)
  }

  async function bulkDelete(ids: number[]) {
    await activityLogApi.bulkDelete(ids)
    logs.value = logs.value.filter(l => !ids.includes(l.id))
    total.value = Math.max(0, total.value - ids.length)
  }

  async function deleteByDate(from_date: string, to_date: string) {
    const res = await activityLogApi.deleteByDate(from_date, to_date)
    return res.data.message
  }

  async function clearAll() {
    const res = await activityLogApi.clear()
    logs.value = []
    total.value = 0
    return res.data.message
  }

  async function exportLogs(exportFilters?: ActivityLogFilters) {
    const { page: _, limit: __, ...base } = filters.value
    const res = await activityLogApi.export({ ...base, ...exportFilters })
    const blob = new Blob([res.data], { type: res.headers['content-type'] })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-logs_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  function setFilters(newFilters: Partial<ActivityLogFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = { page: 1, limit: 10, sort_by: 'created_at', sort_order: 'desc' }
  }

  return {
    logs,
    currentLog,
    isLoading,
    total,
    meta,
    filters,
    fetchLogs,
    fetchLog,
    deleteLog,
    bulkDelete,
    deleteByDate,
    clearAll,
    exportLogs,
    setFilters,
    resetFilters,
  }
})
