import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { getErrorMessage } from '@/utils/errorMessage'
import { type TaskAssignmentItemType, type TaskAssignmentItemTypeFilters, type TaskAssignmentItemTypeFormData, type TaskAssignmentItemTypeStats, taskAssignmentItemTypeApi } from '@/api/modules/task-assignment-item-type'

export const useTaskAssignmentItemTypeStore = defineStore('taskAssignmentItemType', () => {
  const itemTypes = ref<TaskAssignmentItemType[]>([])
  const currentItemType = ref<TaskAssignmentItemType | null>(null)
  const stats = ref<TaskAssignmentItemTypeStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<any>(null)

  const filters = ref<TaskAssignmentItemTypeFilters>({
    page: 1,
    limit: 15,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  const total = computed(() => meta.value?.total || 0)

  async function fetchStats() {
    try {
      const response = await taskAssignmentItemTypeApi.stats()
      if (response.data.success && response.data.data)
        stats.value = response.data.data
    }
    catch (err: any) {
      console.error('Fetch task assignment item type stats error:', err)
    }
  }

  async function fetchItemTypes(customFilters?: TaskAssignmentItemTypeFilters) {
    try {
      isLoading.value = true
      error.value = null

      const response = await taskAssignmentItemTypeApi.list({ ...filters.value, ...customFilters })
      if (response.data.success) {
        itemTypes.value = response.data.data || []
        meta.value = response.data.meta
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Lấy danh sách loại công việc thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function createItemType(data: TaskAssignmentItemTypeFormData) {
    try {
      isLoading.value = true

      const response = await taskAssignmentItemTypeApi.create(data)
      if (response.data.success && response.data.data) {
        itemTypes.value.unshift(response.data.data)

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Tạo loại công việc thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateItemType(id: number, data: Partial<TaskAssignmentItemTypeFormData>) {
    try {
      isLoading.value = true

      const response = await taskAssignmentItemTypeApi.update(id, data)
      if (response.data.success && response.data.data) {
        const index = itemTypes.value.findIndex(t => t.id === id)
        if (index !== -1)
          itemTypes.value[index] = response.data.data!

        if (currentItemType.value?.id === id)
          currentItemType.value = response.data.data!

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật loại công việc thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function deleteItemType(id: number) {
    try {
      isLoading.value = true
      await taskAssignmentItemTypeApi.delete(id)
      itemTypes.value = itemTypes.value.filter(t => t.id !== id)
      if (currentItemType.value?.id === id)
        currentItemType.value = null
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Xóa loại công việc thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function bulkDelete(ids: number[]) {
    try {
      isLoading.value = true
      await taskAssignmentItemTypeApi.bulkDelete(ids)
      itemTypes.value = itemTypes.value.filter(t => !ids.includes(t.id))
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Xóa hàng loạt thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function bulkUpdateStatus(ids: number[], status: 'active' | 'inactive') {
    try {
      isLoading.value = true
      await taskAssignmentItemTypeApi.bulkUpdateStatus(ids, status)
      itemTypes.value = itemTypes.value.map(t => ids.includes(t.id) ? { ...t, status } : t)
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật trạng thái thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function changeStatus(id: number, status: 'active' | 'inactive') {
    try {
      isLoading.value = true

      const response = await taskAssignmentItemTypeApi.changeStatus(id, status)
      if (response.data.success && response.data.data) {
        const index = itemTypes.value.findIndex(t => t.id === id)
        if (index !== -1)
          itemTypes.value[index] = response.data.data!

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Thay đổi trạng thái thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function exportItemTypes(exportFilters?: TaskAssignmentItemTypeFilters) {
    try {
      const response = await taskAssignmentItemTypeApi.export(exportFilters)
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `task-assignment-item-types_${new Date().toISOString().slice(0, 10)}.xlsx`
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
      const response = await taskAssignmentItemTypeApi.downloadTemplate()
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = 'mau-import-loai-cong-viec.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Tải file mẫu thất bại')
      throw err
    }
  }

  async function importItemTypes(file: File) {
    try {
      isLoading.value = true

      const response = await taskAssignmentItemTypeApi.import(file)
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

  function setFilters(newFilters: Partial<TaskAssignmentItemTypeFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = { page: 1, limit: 15, sort_by: 'created_at', sort_order: 'desc' }
  }

  return {
    itemTypes,
    currentItemType,
    stats,
    isLoading,
    error,
    filters,
    meta,
    total,
    fetchStats,
    fetchItemTypes,
    createItemType,
    updateItemType,
    deleteItemType,
    bulkDelete,
    bulkUpdateStatus,
    changeStatus,
    exportItemTypes,
    downloadTemplate,
    importItemTypes,
    setFilters,
    resetFilters,
  }
})
