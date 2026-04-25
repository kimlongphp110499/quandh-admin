import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { type Role, type RoleFilters, type RoleFormData, type RoleStats, roleApi } from '../services/roleApi'

export const useRoleStore = defineStore('role', () => {
  const roles = ref<Role[]>([])
  const currentRole = ref<Role | null>(null)
  const stats = ref<RoleStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<any>(null)

  const filters = ref<RoleFilters>({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  const total = computed(() => meta.value?.total || 0)

  async function fetchStats() {
    try {
      const response = await roleApi.stats()
      if (response.data.success && response.data.data)
        stats.value = response.data.data
    }
    catch (err: any) {
      console.error('Fetch role stats error:', err)
    }
  }

  async function fetchRoles(customFilters?: RoleFilters) {
    try {
      isLoading.value = true
      error.value = null

      const response = await roleApi.list({ ...filters.value, ...customFilters })
      if (response.data.success) {
        roles.value = response.data.data || []
        meta.value = response.data.meta
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Lấy danh sách vai trò thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchRole(id: number) {
    try {
      isLoading.value = true

      const response = await roleApi.show(id)
      if (response.data.success && response.data.data)
        currentRole.value = response.data.data
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Lấy chi tiết vai trò thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function createRole(data: RoleFormData) {
    try {
      isLoading.value = true

      const response = await roleApi.create(data)
      if (response.data.success && response.data.data) {
        roles.value.unshift(response.data.data)

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Tạo vai trò thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateRole(id: number, data: Partial<RoleFormData>) {
    try {
      isLoading.value = true

      const response = await roleApi.update(id, data)
      if (response.data.success && response.data.data) {
        const index = roles.value.findIndex(r => r.id === id)
        if (index !== -1)
          roles.value[index] = response.data.data!

        if (currentRole.value?.id === id)
          currentRole.value = response.data.data!

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Cập nhật vai trò thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function deleteRole(id: number) {
    try {
      isLoading.value = true
      await roleApi.delete(id)
      roles.value = roles.value.filter(r => r.id !== id)
      if (currentRole.value?.id === id)
        currentRole.value = null
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xóa vai trò thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function bulkDelete(ids: number[]) {
    try {
      isLoading.value = true
      await roleApi.bulkDelete(ids)
      roles.value = roles.value.filter(r => !ids.includes(r.id))
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xóa hàng loạt thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function exportRoles(exportFilters?: RoleFilters) {
    try {
      const response = await roleApi.export(exportFilters)
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `roles_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xuất danh sách thất bại'
      throw err
    }
  }

  async function importRoles(file: File) {
    try {
      isLoading.value = true

      const response = await roleApi.import(file)
      if (response.data.success)
        return response.data.data
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Nhập dữ liệu thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  function setFilters(newFilters: Partial<RoleFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = { page: 1, limit: 15, sort_by: 'created_at', sort_order: 'desc' }
  }

  return {
    roles,
    currentRole,
    stats,
    isLoading,
    error,
    filters,
    meta,
    total,
    fetchStats,
    fetchRoles,
    fetchRole,
    createRole,
    updateRole,
    deleteRole,
    bulkDelete,
    exportRoles,
    importRoles,
    setFilters,
    resetFilters,
  }
})
