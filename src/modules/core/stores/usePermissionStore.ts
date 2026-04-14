import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { type Permission, type PermissionFilters, type PermissionFormData, type PermissionStats, permissionApi } from '../services/permissionApi'

export const usePermissionStore = defineStore('permission', () => {
  const permissions = ref<Permission[]>([])
  const permissionTree = ref<Permission[]>([])
  const currentPermission = ref<Permission | null>(null)
  const stats = ref<PermissionStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<any>(null)

  const filters = ref<PermissionFilters>({
    page: 1,
    limit: 10,
    sort_by: 'sort_order',
    sort_order: 'asc',
  })

  const total = computed(() => meta.value?.total || 0)

  async function fetchStats() {
    try {
      const response = await permissionApi.stats()
      if (response.data.success && response.data.data)
        stats.value = response.data.data
    }
    catch (err: any) {
      console.error('Fetch permission stats error:', err)
    }
  }

  async function fetchPermissions(customFilters?: PermissionFilters) {
    try {
      isLoading.value = true
      error.value = null

      const response = await permissionApi.list({ ...filters.value, ...customFilters })
      if (response.data.success) {
        permissions.value = response.data.data || []
        meta.value = response.data.meta
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Lấy danh sách quyền thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchTree() {
    try {
      const response = await permissionApi.tree({ with_roles: true })

      if (response.data.success)
        permissionTree.value = response.data.data || []
    }
    catch (err: any) {
      console.error('Fetch permission tree error:', err)
    }
  }

  async function createPermission(data: PermissionFormData) {
    try {
      isLoading.value = true

      const response = await permissionApi.create(data)
      if (response.data.success && response.data.data) {
        permissions.value.unshift(response.data.data)

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Tạo quyền thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function updatePermission(id: number, data: Partial<PermissionFormData>) {
    try {
      isLoading.value = true

      const response = await permissionApi.update(id, data)
      if (response.data.success && response.data.data) {
        const index = permissions.value.findIndex(p => p.id === id)
        if (index !== -1)
          permissions.value[index] = response.data.data!

        if (currentPermission.value?.id === id)
          currentPermission.value = response.data.data!

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Cập nhật quyền thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function deletePermission(id: number) {
    try {
      isLoading.value = true
      await permissionApi.delete(id)
      permissions.value = permissions.value.filter(p => p.id !== id)
      if (currentPermission.value?.id === id)
        currentPermission.value = null
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xóa quyền thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function bulkDelete(ids: number[]) {
    try {
      isLoading.value = true
      await permissionApi.bulkDelete(ids)
      permissions.value = permissions.value.filter(p => !ids.includes(p.id))
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xóa hàng loạt thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function exportPermissions(exportFilters?: PermissionFilters) {
    try {
      const response = await permissionApi.export(exportFilters)
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `permissions_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xuất danh sách thất bại'
      throw err
    }
  }

  function setFilters(newFilters: Partial<PermissionFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = { page: 1, limit: 20, sort_by: 'sort_order', sort_order: 'asc' }
  }

  return {
    permissions,
    permissionTree,
    currentPermission,
    stats,
    isLoading,
    error,
    filters,
    meta,
    total,
    fetchStats,
    fetchPermissions,
    fetchTree,
    createPermission,
    updatePermission,
    deletePermission,
    bulkDelete,
    exportPermissions,
    setFilters,
    resetFilters,
  }
})
