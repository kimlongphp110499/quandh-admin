import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { type Type, type TypeFilters, type TypeFormData, type TypeStats, typeApi } from '../services/typeApi'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { getErrorMessage } from '@/utils/errorMessage'

export const useTypeStore = defineStore('taskAssignmentType', () => {
  const types = ref<Type[]>([])
  const currentType = ref<Type | null>(null)
  const stats = ref<TypeStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<any>(null)

  const filters = ref<TypeFilters>({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  const total = computed(() => meta.value?.total || 0)

  async function fetchStats() {
    try {
      const response = await typeApi.stats()
      if (response.data.success && response.data.data)
        stats.value = response.data.data
    }
    catch (err: any) {
      console.error('Fetch task assignment type stats error:', err)
    }
  }

  async function fetchTypes(customFilters?: TypeFilters) {
    try {
      isLoading.value = true
      error.value = null

      const response = await typeApi.list({ ...filters.value, ...customFilters })
      if (response.data.success) {
        types.value = response.data.data || []
        meta.value = response.data.meta
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Lấy danh sách loại văn bản thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function createType(data: TypeFormData) {
    try {
      isLoading.value = true

      const response = await typeApi.create(data)
      if (response.data.success && response.data.data) {
        types.value.unshift(response.data.data)

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Tạo loại văn bản thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateType(id: number, data: Partial<TypeFormData>) {
    try {
      isLoading.value = true

      const response = await typeApi.update(id, data)
      if (response.data.success && response.data.data) {
        const index = types.value.findIndex(t => t.id === id)
        if (index !== -1)
          types.value[index] = response.data.data!

        if (currentType.value?.id === id)
          currentType.value = response.data.data!

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật loại văn bản thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function deleteType(id: number) {
    try {
      isLoading.value = true
      await typeApi.delete(id)
      types.value = types.value.filter(t => t.id !== id)
      if (currentType.value?.id === id)
        currentType.value = null
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Xóa loại văn bản thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function bulkDelete(ids: number[]) {
    try {
      isLoading.value = true
      await typeApi.bulkDelete(ids)
      types.value = types.value.filter(t => !ids.includes(t.id))
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
      await typeApi.bulkUpdateStatus(ids, status)
      types.value = types.value.map(t => ids.includes(t.id) ? { ...t, status } : t)
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

      const response = await typeApi.changeStatus(id, status)
      if (response.data.success && response.data.data) {
        const index = types.value.findIndex(t => t.id === id)
        if (index !== -1)
          types.value[index] = response.data.data!

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

  async function exportTypes(exportFilters?: TypeFilters) {
    try {
      const response = await typeApi.export(exportFilters)
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `task-assignment-types_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Xuất danh sách thất bại')
      throw err
    }
  }

  async function importTypes(file: File) {
    try {
      isLoading.value = true

      const response = await typeApi.import(file)
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

  async function downloadTemplate() {
    try {
      const response = await typeApi.downloadTemplate()
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = 'mau-import-phong-ban.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Tải file mẫu thất bại')
      throw err
    }
  }

  function setFilters(newFilters: Partial<TypeFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = { page: 1, limit: 15, sort_by: 'created_at', sort_order: 'desc' }
  }

  return {
    types,
    currentType,
    stats,
    isLoading,
    error,
    filters,
    meta,
    total,
    fetchStats,
    fetchTypes,
    createType,
    updateType,
    deleteType,
    bulkDelete,
    bulkUpdateStatus,
    changeStatus,
    exportTypes,
    importTypes,
    downloadTemplate,
    setFilters,
    resetFilters,
  }
})
