import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  type Item,
  type ItemFilters,
  type ItemFormData,
  type ItemProgressData,
  type ItemReport,
  type ItemReportFormData,
  type ItemStats,
  type ItemStatus,
  itemApi,
} from '../services/itemApi'

import { getErrorMessage } from '@/utils/errorMessage'

export const useItemStore = defineStore('taskAssignmentItem', () => {
  const items = ref<Item[]>([])
  const currentItem = ref<Item | null>(null)
  const stats = ref<ItemStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<any>(null)

  const filters = ref<ItemFilters>({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  const total = computed(() => meta.value?.total || 0)

  async function fetchStats(customFilters?: ItemFilters) {
    try {
      const response = await itemApi.stats(customFilters)
      if (response.data.success && response.data.data)
        stats.value = response.data.data
    }
    catch (err: any) {
      console.error('Fetch task assignment item stats error:', err)
    }
  }

  async function fetchItems(customFilters?: ItemFilters) {
    try {
      isLoading.value = true
      error.value = null

      const response = await itemApi.list({ ...filters.value, ...customFilters })
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

  async function createItem(data: ItemFormData) {
    try {
      isLoading.value = true

      const response = await itemApi.create(data)
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

  async function updateItem(id: number, data: Partial<ItemFormData>) {
    try {
      isLoading.value = true

      const response = await itemApi.update(id, data)
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
      await itemApi.delete(id)
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
      await itemApi.bulkDelete(ids)
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

  async function changeStatus(id: number, status: ItemStatus) {
    try {
      isLoading.value = true

      const response = await itemApi.changeStatus(id, status)
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

  async function bulkUpdateStatus(ids: number[], status: ItemStatus) {
    try {
      isLoading.value = true
      await itemApi.bulkUpdateStatus(ids, status)
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

  async function exportItems(exportFilters?: ItemFilters) {
    try {
      const response = await itemApi.export(exportFilters)
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
      const response = await itemApi.downloadTemplate()
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

      const response = await itemApi.import(file)
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

  async function updateProgress(id: number, data: ItemProgressData) {
    try {
      isLoading.value = true

      const response = await itemApi.updateProgress(id, data)
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

  async function getReports(id: number): Promise<ItemReport[]> {
    try {
      const response = await itemApi.getReports(id)
      if (response.data.success)
        return response.data.data || []

      return []
    }
    catch {
      return []
    }
  }

  async function createReport(id: number, data: ItemReportFormData) {
    try {
      const response = await itemApi.createReport(id, data)
      if (response.data.success)
        return response.data.data
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Nộp báo cáo thất bại')
      throw err
    }
  }

  async function updateReport(reportId: number, data: ItemReportFormData) {
    try {
      const response = await itemApi.updateReport(reportId, data)
      if (response.data.success)
        return response.data.data
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật báo cáo thất bại')
      throw err
    }
  }

  function setFilters(newFilters: Partial<ItemFilters>) {
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
