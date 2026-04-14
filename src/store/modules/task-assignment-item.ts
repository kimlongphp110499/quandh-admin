import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { getErrorMessage } from '@/utils/errorMessage'
import {
  type TaskAssignmentItem,
  type TaskAssignmentItemFilters,
  type TaskAssignmentItemFormData,
  type TaskAssignmentItemProgressData,
  type TaskAssignmentItemReport,
  type TaskAssignmentItemReportFormData,
  type TaskAssignmentItemStats,
  type TaskAssignmentItemStatus,
  taskAssignmentItemApi,
} from '@/api/modules/task-assignment-item'

export const useTaskAssignmentItemStore = defineStore('taskAssignmentItem', () => {
  const items = ref<TaskAssignmentItem[]>([])
  const currentItem = ref<TaskAssignmentItem | null>(null)
  const stats = ref<TaskAssignmentItemStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<any>(null)

  const filters = ref<TaskAssignmentItemFilters>({
    page: 1,
    limit: 15,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  const total = computed(() => meta.value?.total || 0)

  async function fetchStats(customFilters?: TaskAssignmentItemFilters) {
    try {
      const response = await taskAssignmentItemApi.stats(customFilters)
      if (response.data.success && response.data.data)
        stats.value = response.data.data
    }
    catch (err: any) {
      console.error('Fetch task assignment item stats error:', err)
    }
  }

  async function fetchItems(customFilters?: TaskAssignmentItemFilters) {
    try {
      isLoading.value = true
      error.value = null

      const response = await taskAssignmentItemApi.list({ ...filters.value, ...customFilters })
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

  async function createItem(data: TaskAssignmentItemFormData) {
    try {
      isLoading.value = true

      const response = await taskAssignmentItemApi.create(data)
      if (response.data.success && response.data.data)
        return response.data.data
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Tạo công việc thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateItem(id: number, data: Partial<TaskAssignmentItemFormData>) {
    try {
      isLoading.value = true

      const response = await taskAssignmentItemApi.update(id, data)
      if (response.data.success && response.data.data) {
        const index = items.value.findIndex(d => d.id === id)
        if (index !== -1)
          items.value[index] = response.data.data!

        if (currentItem.value?.id === id)
          currentItem.value = response.data.data!

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật công việc thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function deleteItem(id: number) {
    try {
      isLoading.value = true
      await taskAssignmentItemApi.delete(id)
      items.value = items.value.filter(d => d.id !== id)
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Xóa công việc thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function bulkDelete(ids: number[]) {
    try {
      isLoading.value = true
      await taskAssignmentItemApi.bulkDelete(ids)
      items.value = items.value.filter(d => !ids.includes(d.id))
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Xóa hàng loạt thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function changeStatus(id: number, status: TaskAssignmentItemStatus) {
    try {
      isLoading.value = true

      const response = await taskAssignmentItemApi.changeStatus(id, status)
      if (response.data.success && response.data.data) {
        const index = items.value.findIndex(d => d.id === id)
        if (index !== -1)
          items.value[index] = response.data.data!

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Thay đổi trạng thái thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function bulkUpdateStatus(ids: number[], status: TaskAssignmentItemStatus) {
    try {
      isLoading.value = true
      await taskAssignmentItemApi.bulkUpdateStatus(ids, status)
      items.value = items.value.map(d =>
        ids.includes(d.id) ? { ...d, processing_status: status } : d,
      )
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật trạng thái thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function exportItems(exportFilters?: TaskAssignmentItemFilters) {
    try {
      const response = await taskAssignmentItemApi.export(exportFilters)
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `cong-viec_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Xuất danh sách thất bại')
      throw err
    }
  }

  async function downloadTemplate() {
    try {
      const response = await taskAssignmentItemApi.downloadTemplate()
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = 'mau-import-cong-viec.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Tải file mẫu thất bại')
      throw err
    }
  }

  async function importItems(file: File) {
    try {
      isLoading.value = true

      const response = await taskAssignmentItemApi.import(file)
      if (response.data.success)
        return response.data.data
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Nhập dữ liệu thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateProgress(id: number, data: TaskAssignmentItemProgressData) {
    try {
      isLoading.value = true

      const response = await taskAssignmentItemApi.updateProgress(id, data)
      if (response.data.success && response.data.data) {
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

  async function getReports(id: number): Promise<TaskAssignmentItemReport[]> {
    try {
      const response = await taskAssignmentItemApi.getReports(id)
      if (response.data.success)
        return response.data.data || []

      return []
    }
    catch {
      return []
    }
  }

  async function createReport(id: number, data: TaskAssignmentItemReportFormData) {
    try {
      const response = await taskAssignmentItemApi.createReport(id, data)
      if (response.data.success)
        return response.data.data
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Nộp báo cáo thất bại')
      throw err
    }
  }

  async function updateReport(reportId: number, data: TaskAssignmentItemReportFormData) {
    try {
      const response = await taskAssignmentItemApi.updateReport(reportId, data)
      if (response.data.success)
        return response.data.data
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật báo cáo thất bại')
      throw err
    }
  }

  function setFilters(newFilters: Partial<TaskAssignmentItemFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = { page: 1, limit: 15, sort_by: 'created_at', sort_order: 'desc' }
  }

  return {
    items,
    currentItem,
    stats,
    isLoading,
    error,
    filters,
    meta,
    total,
    fetchStats,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    bulkDelete,
    changeStatus,
    bulkUpdateStatus,
    exportItems,
    downloadTemplate,
    importItems,
    updateProgress,
    getReports,
    createReport,
    updateReport,
    setFilters,
    resetFilters,
  }
})
