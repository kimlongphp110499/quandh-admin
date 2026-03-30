/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { type Organization, type OrganizationFilters, type OrganizationFormData, type OrganizationStats, organizationApi } from '@/api/modules/organization'

export const useOrganizationStore = defineStore('organization', () => {
  // State
  const organizations = ref<Organization[]>([])
  const currentOrganization = ref<Organization | null>(null)
  const stats = ref<OrganizationStats | null>(null)
  const tree = ref<Organization[]>([])
  const parentOptions = ref<{ id: number; name: string }[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<any>(null)

  const filters = ref<OrganizationFilters>({
    limit: 10,
    sort_by: 'sort_order',
    sort_order: 'asc',
  })

  // Getters
  const total = computed(() => meta.value?.total || 0)
  const activeCount = computed(() => stats.value?.active || 0)
  const inactiveCount = computed(() => stats.value?.inactive || 0)

  // Actions
  async function fetchStats() {
    try {
      const response = await organizationApi.stats()
      if (response.data.success && response.data.data)
        stats.value = response.data.data
    }
    catch (err: any) {
      console.error('Fetch org stats error:', err)
    }
  }

  async function fetchOrganizations(customFilters?: OrganizationFilters) {
    try {
      isLoading.value = true
      error.value = null

      const response = await organizationApi.list({ ...filters.value, ...customFilters })

      if (response.data.success) {
        organizations.value = response.data.data || []
        meta.value = response.data.meta
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Lấy danh sách tổ chức thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchOrganization(id: number) {
    try {
      isLoading.value = true

      const response = await organizationApi.show(id)
      if (response.data.success && response.data.data)
        currentOrganization.value = response.data.data
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Lấy chi tiết tổ chức thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchTree() {
    try {
      const response = await organizationApi.tree()
      if (response.data.success)
        tree.value = response.data.data || []
    }
    catch (err: any) {
      console.error('Fetch org tree error:', err)
    }
  }

  async function fetchParentOptions() {
    try {
      const response = await organizationApi.publicOptions()
      if (response.data.success)
        parentOptions.value = response.data.data || []
    }
    catch (err: any) {
      console.error('Fetch parent options error:', err)
    }
  }

  async function createOrganization(data: OrganizationFormData) {
    try {
      isLoading.value = true

      const response = await organizationApi.create(data)
      if (response.data.success && response.data.data) {
        organizations.value.unshift(response.data.data)

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Tạo tổ chức thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateOrganization(id: number, data: Partial<OrganizationFormData>) {
    try {
      isLoading.value = true

      const response = await organizationApi.update(id, data)
      if (response.data.success && response.data.data) {
        const index = organizations.value.findIndex(o => o.id === id)
        if (index !== -1)
          organizations.value[index] = response.data.data!

        if (currentOrganization.value?.id === id)
          currentOrganization.value = response.data.data!

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Cập nhật tổ chức thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function deleteOrganization(id: number) {
    try {
      isLoading.value = true
      await organizationApi.delete(id)
      organizations.value = organizations.value.filter(o => o.id !== id)
      if (currentOrganization.value?.id === id)
        currentOrganization.value = null
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xóa tổ chức thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function changeStatus(id: number, status: 'active' | 'inactive') {
    try {
      isLoading.value = true

      const response = await organizationApi.changeStatus(id, status)
      if (response.data.success && response.data.data) {
        const index = organizations.value.findIndex(o => o.id === id)
        if (index !== -1)
          organizations.value[index] = response.data.data!

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
      await organizationApi.bulkDelete(ids)
      organizations.value = organizations.value.filter(o => !ids.includes(o.id))
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xóa hàng loạt thất bại'
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
      error.value = err.response?.data?.message || 'Cập nhật trạng thái hàng loạt thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function exportOrganizations(exportFilters?: OrganizationFilters) {
    try {
      const { page: _page, limit: _limit, ...baseFilters } = filters.value
      const response = await organizationApi.export({ ...baseFilters, ...exportFilters })
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `organizations_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xuất danh sách thất bại'
      throw err
    }
  }

  async function importOrganizations(file: File) {
    try {
      isLoading.value = true

      const response = await organizationApi.import(file)

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

  async function downloadImportTemplate() {
    const response = await organizationApi.downloadTemplate()
    const blob = new Blob([response.data], { type: response.headers['content-type'] })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = 'organizations_template.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  function setFilters(newFilters: Partial<OrganizationFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = {
      limit: 10,
      sort_by: 'sort_order',
      sort_order: 'asc',
    }
  }

  return {
    organizations,
    currentOrganization,
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
    fetchOrganizations,
    fetchOrganization,
    fetchTree,
    fetchParentOptions,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    changeStatus,
    bulkDelete,
    bulkUpdateStatus,
    exportOrganizations,
    importOrganizations,
    downloadImportTemplate,
    setFilters,
    resetFilters,
  }
})
