import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { type Department, type DepartmentFilters, type DepartmentFormData, type DepartmentStats, departmentApi } from '../services/departmentApi'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { getErrorMessage } from '@/utils/errorMessage'

export const useDepartmentStore = defineStore('department', () => {
  const departments = ref<Department[]>([])
  const currentDepartment = ref<Department | null>(null)
  const stats = ref<DepartmentStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<any>(null)

  const filters = ref<DepartmentFilters>({
    page: 1,
    limit: 10,
    sort_by: 'sort_order',
    sort_order: 'asc',
  })

  const total = computed(() => meta.value?.total || 0)

  async function fetchStats() {
    try {
      const response = await departmentApi.stats()
      if (response.data.success && response.data.data)
        stats.value = response.data.data
    }
    catch (err: any) {
      console.error('Fetch task assignment department stats error:', err)
    }
  }

  async function fetchDepartments(customFilters?: DepartmentFilters) {
    try {
      isLoading.value = true
      error.value = null

      const response = await departmentApi.list({ ...filters.value, ...customFilters })
      if (response.data.success) {
        departments.value = response.data.data || []
        meta.value = response.data.meta
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Lấy danh sách phòng ban thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchDepartment(id: number) {
    try {
      isLoading.value = true

      const response = await departmentApi.show(id)
      if (response.data.success && response.data.data)
        currentDepartment.value = response.data.data
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Lấy chi tiết phòng ban thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function createDepartment(data: DepartmentFormData) {
    try {
      isLoading.value = true

      const response = await departmentApi.create(data)
      if (response.data.success && response.data.data) {
        departments.value.unshift(response.data.data)

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Tạo phòng ban thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateDepartment(id: number, data: Partial<DepartmentFormData>) {
    try {
      isLoading.value = true

      const response = await departmentApi.update(id, data)
      if (response.data.success && response.data.data) {
        const index = departments.value.findIndex(d => d.id === id)
        if (index !== -1)
          departments.value[index] = response.data.data!

        if (currentDepartment.value?.id === id)
          currentDepartment.value = response.data.data!

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật phòng ban thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function deleteDepartment(id: number) {
    try {
      isLoading.value = true
      await departmentApi.delete(id)
      departments.value = departments.value.filter(d => d.id !== id)
      if (currentDepartment.value?.id === id)
        currentDepartment.value = null
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Xóa phòng ban thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function bulkDelete(ids: number[]) {
    try {
      isLoading.value = true
      await departmentApi.bulkDelete(ids)
      departments.value = departments.value.filter(d => !ids.includes(d.id))
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
      await departmentApi.bulkUpdateStatus(ids, status)
      departments.value = departments.value.map(d => ids.includes(d.id) ? { ...d, status } : d)
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật trạng thái thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function exportDepartments(exportFilters?: DepartmentFilters) {
    try {
      const response = await departmentApi.export(exportFilters)
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `task-assignment-departments_${new Date().toISOString().slice(0, 10)}.xlsx`
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
      const response = await departmentApi.downloadTemplate()
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

  async function importDepartments(file: File) {
    try {
      isLoading.value = true

      const response = await departmentApi.import(file)
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

  async function changeStatus(id: number, status: 'active' | 'inactive') {
    try {
      isLoading.value = true

      const response = await departmentApi.changeStatus(id, status)
      if (response.data.success && response.data.data) {
        const index = departments.value.findIndex(d => d.id === id)
        if (index !== -1)
          departments.value[index] = response.data.data!

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

  function setFilters(newFilters: Partial<DepartmentFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = { page: 1, limit: 15, sort_by: 'sort_order', sort_order: 'asc' }
  }

  return {
    departments,
    currentDepartment,
    stats,
    isLoading,
    error,
    filters,
    meta,
    total,
    fetchStats,
    fetchDepartments,
    fetchDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    bulkDelete,
    bulkUpdateStatus,
    exportDepartments,
    downloadTemplate,
    importDepartments,
    setFilters,
    resetFilters,
    changeStatus,
  }
})
