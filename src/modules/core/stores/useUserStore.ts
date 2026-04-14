import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getErrorMessage } from '@/utils/errorMessage'
import type { User, UserFilters, UserFormData, UserStats } from '../services/userApi'
import { userApi } from '../services/userApi'

export const useUserStore = defineStore('user-management', () => {
  // ── State ────────────────────────────────────────────────────────
  const items = ref<User[]>([])
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

  // ── Getters ──────────────────────────────────────────────────────
  const total = computed(() => meta.value?.total || 0)

  // ── Actions ──────────────────────────────────────────────────────
  async function fetchStats() {
    try {
      const res = await userApi.stats()
      if (res.data.success && res.data.data)
        stats.value = res.data.data
    }
    catch (err: any) {
      console.error('Lỗi tải thống kê người dùng:', err)
    }
  }

  async function fetchItems(customFilters?: UserFilters) {
    try {
      isLoading.value = true
      error.value = null
      const res = await userApi.list({ ...filters.value, ...customFilters })
      if (res.data.success) {
        items.value = res.data.data || []
        meta.value = res.data.meta
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Lấy danh sách người dùng thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function createItem(data: UserFormData): Promise<User | undefined> {
    try {
      isLoading.value = true
      const res = await userApi.create(data)
      if (res.data.success && res.data.data) {
        items.value.unshift(res.data.data)
        return res.data.data
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Tạo người dùng thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateItem(id: number, data: Partial<UserFormData>): Promise<User | undefined> {
    try {
      isLoading.value = true
      const res = await userApi.update(id, data)
      if (res.data.success && res.data.data) {
        const idx = items.value.findIndex(u => u.id === id)
        if (idx !== -1) items.value[idx] = res.data.data!
        return res.data.data
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật người dùng thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function deleteItem(id: number) {
    try {
      isLoading.value = true
      await userApi.delete(id)
      items.value = items.value.filter(u => u.id !== id)
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Xóa người dùng thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function changeStatus(id: number, status: 'active' | 'inactive' | 'banned') {
    try {
      isLoading.value = true
      const res = await userApi.changeStatus(id, status)
      if (res.data.success && res.data.data) {
        const idx = items.value.findIndex(u => u.id === id)
        if (idx !== -1) items.value[idx] = res.data.data!
        return res.data.data
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

  async function bulkDelete(ids: number[]) {
    try {
      isLoading.value = true
      await userApi.bulkDelete(ids)
      items.value = items.value.filter(u => !ids.includes(u.id))
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Xóa hàng loạt thất bại')
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
      error.value = getErrorMessage(err, 'Cập nhật trạng thái hàng loạt thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function exportItems(exportFilters?: UserFilters) {
    try {
      const { page: _, limit: __, ...baseFilters } = filters.value
      const res = await userApi.export({ ...baseFilters, ...exportFilters })
      const blob = new Blob([res.data], { type: res.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Xuất danh sách thất bại')
      throw err
    }
  }

  async function importItems(file: File) {
    try {
      isLoading.value = true
      const res = await userApi.import(file)
      return res.data
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Nhập danh sách thất bại')
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
    filters.value = { page: 1, limit: 10, sort_by: 'created_at', sort_order: 'desc' }
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
    createItem,
    updateItem,
    deleteItem,
    changeStatus,
    bulkDelete,
    bulkUpdateStatus,
    exportItems,
    importItems,
    setFilters,
    resetFilters,
  }
})
