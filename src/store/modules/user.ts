import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { type User, type UserFilters, type UserFormData, type UserStats, userApi } from '@/api/modules/user'

export const useUserStore = defineStore('user', () => {
  // State
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const stats = ref<UserStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<any>(null)

  const filters = ref<UserFilters>({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  // Getters
  const total = computed(() => meta.value?.total || 0)
  const activeCount = computed(() => stats.value?.active || 0)
  const inactiveCount = computed(() => stats.value?.inactive || 0)

  // Actions
  async function fetchStats() {
    try {
      const response = await userApi.stats()
      if (response.data.success && response.data.data)
        stats.value = response.data.data
    }
    catch (err: any) {
      console.error('Fetch user stats error:', err)
    }
  }

  async function fetchUsers(customFilters?: UserFilters) {
    try {
      isLoading.value = true
      error.value = null

      const response = await userApi.list({ ...filters.value, ...customFilters })

      if (response.data.success) {
        users.value = response.data.data || []
        meta.value = response.data.meta
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Lấy danh sách người dùng thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchUser(id: number) {
    try {
      isLoading.value = true

      const response = await userApi.show(id)
      if (response.data.success && response.data.data)
        currentUser.value = response.data.data
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Lấy chi tiết người dùng thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function createUser(data: UserFormData) {
    try {
      isLoading.value = true

      const response = await userApi.create(data)
      if (response.data.success && response.data.data) {
        users.value.unshift(response.data.data)

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Tạo người dùng thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateUser(id: number, data: Partial<UserFormData>) {
    try {
      isLoading.value = true

      const response = await userApi.update(id, data)
      if (response.data.success && response.data.data) {
        const index = users.value.findIndex(u => u.id === id)
        if (index !== -1)
          users.value[index] = response.data.data!

        if (currentUser.value?.id === id)
          currentUser.value = response.data.data!

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Cập nhật người dùng thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function deleteUser(id: number) {
    try {
      isLoading.value = true
      await userApi.delete(id)
      users.value = users.value.filter(u => u.id !== id)
      if (currentUser.value?.id === id)
        currentUser.value = null
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xóa người dùng thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function changeStatus(id: number, status: 'active' | 'inactive' | 'banned') {
    try {
      isLoading.value = true

      const response = await userApi.changeStatus(id, status)
      if (response.data.success && response.data.data) {
        const index = users.value.findIndex(u => u.id === id)
        if (index !== -1)
          users.value[index] = response.data.data!

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

  async function bulkDelete(ids: number[]) {
    try {
      isLoading.value = true
      await userApi.bulkDelete(ids)
      users.value = users.value.filter(u => !ids.includes(u.id))
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xóa hàng loạt thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function bulkUpdateStatus(ids: number[], status: 'active' | 'inactive' | 'banned') {
    try {
      isLoading.value = true
      await userApi.bulkStatus(ids, status)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Cập nhật trạng thái hàng loạt thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function exportUsers(exportFilters?: UserFilters) {
    try {
      const { page: __, limit: ___, ...baseFilters } = filters.value
      const response = await userApi.export({ ...baseFilters, ...exportFilters })
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `users_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xuất danh sách thất bại'
      throw err
    }
  }

  async function importUsers(file: File) {
    try {
      isLoading.value = true

      const response = await userApi.import(file)

      return response.data
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Nhập danh sách thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  function setFilters(newFilters: Partial<UserFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = {
      page: 1,
      limit: 10,
      sort_by: 'created_at',
      sort_order: 'desc',
    }
  }

  return {
    users,
    currentUser,
    stats,
    isLoading,
    error,
    filters,
    meta,
    total,
    activeCount,
    inactiveCount,
    fetchStats,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    changeStatus,
    bulkDelete,
    bulkUpdateStatus,
    exportUsers,
    importUsers,
    setFilters,
    resetFilters,
  }
})
