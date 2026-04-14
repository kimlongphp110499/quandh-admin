import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getErrorMessage } from '@/utils/errorMessage'
import {
  type MyTaskFilters,
  type MyTaskItem,
  type MyTaskProgressData,
  type MyTaskReport,
  type MyTaskReportFormData,
  type MyTaskStats,
  myTaskAssignmentItemApi,
} from '@/api/modules/my-task-assignment-item'

export const useMyTaskAssignmentItemStore = defineStore('myTaskAssignmentItem', () => {
  const items = ref<MyTaskItem[]>([])
  const stats = ref<MyTaskStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<any>(null)

  const filters = ref<MyTaskFilters>({
    page: 1,
    limit: 15,
    sort_by: 'end_at',
    sort_order: 'asc',
  })

  const total = computed(() => meta.value?.total || 0)

  async function fetchStats(customFilters?: Omit<MyTaskFilters, 'page' | 'limit'>) {
    try {
      const response = await myTaskAssignmentItemApi.stats(customFilters)
      if (response.data.success && response.data.data)
        stats.value = response.data.data
    }
    catch (err: any) {
      console.error('Lỗi tải thống kê công việc của tôi:', err)
    }
  }

  async function fetchItems(customFilters?: MyTaskFilters) {
    try {
      isLoading.value = true
      error.value = null

      const response = await myTaskAssignmentItemApi.list({ ...filters.value, ...customFilters })
      if (response.data.success) {
        items.value = response.data.data || []
        meta.value = response.data.meta
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Lấy danh sách công việc thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateProgress(id: number, data: MyTaskProgressData): Promise<MyTaskItem | undefined> {
    try {
      isLoading.value = true

      const response = await myTaskAssignmentItemApi.updateProgress(id, data)
      if (response.data.success && response.data.data) {
        // Cập nhật item trong danh sách
        const index = items.value.findIndex(d => d.id === id)
        if (index !== -1)
          items.value[index] = response.data.data!

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật tiến độ thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function getReports(id: number): Promise<MyTaskReport[]> {
    try {
      const response = await myTaskAssignmentItemApi.getReports(id)
      if (response.data.success)
        return response.data.data || []

      return []
    }
    catch {
      return []
    }
  }

  async function createReport(id: number, data: MyTaskReportFormData): Promise<MyTaskReport | undefined> {
    try {
      const response = await myTaskAssignmentItemApi.createReport(id, data)
      if (response.data.success)
        return response.data.data
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Nộp báo cáo thất bại')
      throw err
    }
  }

  async function updateReport(reportId: number, data: MyTaskReportFormData): Promise<MyTaskReport | undefined> {
    try {
      const response = await myTaskAssignmentItemApi.updateReport(reportId, data)
      if (response.data.success)
        return response.data.data
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật báo cáo thất bại')
      throw err
    }
  }

  function setFilters(newFilters: Partial<MyTaskFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = { page: 1, limit: 15, sort_by: 'end_at', sort_order: 'asc' }
  }

  return {
    items,
    stats,
    isLoading,
    error,
    filters,
    meta,
    total,
    fetchStats,
    fetchItems,
    updateProgress,
    getReports,
    createReport,
    updateReport,
    setFilters,
    resetFilters,
  }
})
