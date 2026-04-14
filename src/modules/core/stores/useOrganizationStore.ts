import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Organization, OrganizationFilters, OrganizationFormData, OrganizationStats } from '../services/organizationApi'
import { organizationApi } from '../services/organizationApi'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { getErrorMessage } from '@/utils/errorMessage'

export const useOrganizationStore = defineStore('organization', () => {
  // ── State ────────────────────────────────────────────────────────
  const items = ref<Organization[]>([])
  const stats = ref<OrganizationStats | null>(null)
  const tree = ref<Organization[]>([])
  const parentOptions = ref<{ id: number; name: string }[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<any>(null)

  const filters = ref<OrganizationFilters>({
    page: 1,
    limit: 10,
    sort_by: 'sort_order',
    sort_order: 'asc',
  })

  // ── Getters ──────────────────────────────────────────────────────
  const total = computed(() => meta.value?.total || 0)
  const activeCount = computed(() => stats.value?.active || 0)
  const inactiveCount = computed(() => stats.value?.inactive || 0)

  // ── Actions ──────────────────────────────────────────────────────
  async function fetchStats() {
    try {
      const res = await organizationApi.stats()

      if (res.data.success && res.data.data)
        stats.value = res.data.data
    }
    catch (err: any) {
      console.error('Lỗi tải thống kê tổ chức:', err)
    }
  }

  async function fetchItems(customFilters?: OrganizationFilters) {
    try {
      isLoading.value = true
      error.value = null

      const res = await organizationApi.list({ ...filters.value, ...customFilters })

      if (res.data.success) {
        items.value = res.data.data || []
        meta.value = res.data.meta
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Lấy danh sách tổ chức thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchTree() {
    try {
      const res = await organizationApi.tree()

      if (res.data.success)
        tree.value = res.data.data || []
    }
    catch (err: any) {
      console.error('Lỗi tải cây tổ chức:', err)
    }
  }

  async function fetchParentOptions() {
    try {
      const res = await organizationApi.publicOptions()

      if (res.data.success)
        parentOptions.value = res.data.data || []
    }
    catch (err: any) {
      console.error('Lỗi tải danh sách tổ chức cha:', err)
    }
  }

  async function createItem(data: OrganizationFormData): Promise<Organization | undefined> {
    try {
      isLoading.value = true

      const res = await organizationApi.create(data)

      if (res.data.success && res.data.data) {
        items.value.unshift(res.data.data)

        return res.data.data
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Tạo tổ chức thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateItem(id: number, data: Partial<OrganizationFormData>): Promise<Organization | undefined> {
    try {
      isLoading.value = true

      const res = await organizationApi.update(id, data)

      if (res.data.success && res.data.data) {
        const idx = items.value.findIndex(o => o.id === id)

        if (idx !== -1)
          items.value[idx] = res.data.data!

        return res.data.data
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật tổ chức thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function deleteItem(id: number) {
    try {
      isLoading.value = true

      await organizationApi.delete(id)
      items.value = items.value.filter(o => o.id !== id)
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Xóa tổ chức thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function changeStatus(id: number, status: 'active' | 'inactive') {
    try {
      isLoading.value = true

      const res = await organizationApi.changeStatus(id, status)

      if (res.data.success && res.data.data) {
        const idx = items.value.findIndex(o => o.id === id)

        if (idx !== -1)
          items.value[idx] = res.data.data!

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

      await organizationApi.bulkDelete(ids)
      items.value = items.value.filter(o => !ids.includes(o.id))
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

      await organizationApi.bulkStatus(ids, status)
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật trạng thái hàng loạt thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function exportItems(exportFilters?: OrganizationFilters) {
    try {
      const { page: _, limit: __, ...baseFilters } = filters.value
      const res = await organizationApi.export({ ...baseFilters, ...exportFilters })
      const blob = new Blob([res.data], { type: res.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `organizations_${new Date().toISOString().slice(0, 10)}.xlsx`
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

      const res = await organizationApi.import(file)

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

  function setFilters(newFilters: Partial<OrganizationFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = {
      page: 1,
      limit: 10,
      sort_by: 'sort_order',
      sort_order: 'asc',
    }
  }

  return {
    items,
    stats,
    tree,
    parentOptions,
    isLoading,
    error,
    filters,
    meta,
    total,
    activeCount,
    inactiveCount,
    fetchStats,
    fetchItems,
    fetchTree,
    fetchParentOptions,
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
