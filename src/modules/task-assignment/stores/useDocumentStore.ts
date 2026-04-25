import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  type Document,
  type DocumentFilters,
  type DocumentFormData,
  type DocumentStats,
  documentApi,
} from '../services/documentApi'

import { getErrorMessage } from '@/utils/errorMessage'

export const useDocumentStore = defineStore('document', () => {
  const documents = ref<Document[]>([])
  const currentDocument = ref<Document | null>(null)
  const stats = ref<DocumentStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<any>(null)

  const filters = ref<DocumentFilters>({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  const total = computed(() => meta.value?.total || 0)

  async function fetchStats() {
    try {
      const response = await documentApi.stats()
      if (response.data.success && response.data.data)
        stats.value = response.data.data
    }
    catch (err: any) {
      console.error('Fetch task assignment document stats error:', err)
    }
  }

  async function fetchDocuments(customFilters?: DocumentFilters) {
    try {
      isLoading.value = true
      error.value = null

      const response = await documentApi.list({ ...filters.value, ...customFilters })
      if (response.data.success) {
        documents.value = response.data.data || []
        meta.value = response.data.meta
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Lấy danh sách văn bản giao việc thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function createDocument(data: DocumentFormData) {
    try {
      isLoading.value = true

      const response = await documentApi.create(data)
      if (response.data.success && response.data.data) {
        documents.value.unshift(response.data.data)

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Tạo văn bản giao việc thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateDocument(id: number, data: Partial<DocumentFormData>) {
    try {
      isLoading.value = true

      const response = await documentApi.update(id, data)
      if (response.data.success && response.data.data) {
        const index = documents.value.findIndex(d => d.id === id)
        if (index !== -1)
          documents.value[index] = response.data.data!

        if (currentDocument.value?.id === id)
          currentDocument.value = response.data.data!

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật văn bản giao việc thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function deleteDocument(id: number) {
    try {
      isLoading.value = true
      await documentApi.delete(id)
      documents.value = documents.value.filter(d => d.id !== id)
      if (currentDocument.value?.id === id)
        currentDocument.value = null
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Xóa văn bản giao việc thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function bulkDelete(ids: number[]) {
    try {
      isLoading.value = true
      await documentApi.bulkDelete(ids)
      documents.value = documents.value.filter(d => !ids.includes(d.id))
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Xóa hàng loạt thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function bulkUpdateStatus(ids: number[], status: 'draft' | 'issued') {
    try {
      isLoading.value = true
      await documentApi.bulkUpdateStatus(ids, status)
      documents.value = documents.value.map(d => ids.includes(d.id) ? { ...d, status } : d)
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Cập nhật trạng thái thất bại')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function changeStatus(id: number, status: 'draft' | 'issued') {
    try {
      isLoading.value = true

      const response = await documentApi.changeStatus(id, status)
      if (response.data.success && response.data.data) {
        const index = documents.value.findIndex(d => d.id === id)
        if (index !== -1)
          documents.value[index] = response.data.data!

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

  async function exportDocuments(exportFilters?: DocumentFilters) {
    try {
      const response = await documentApi.export(exportFilters)
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `van-ban-giao-viec_${new Date().toISOString().slice(0, 10)}.xlsx`
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
      const response = await documentApi.downloadTemplate()
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = 'mau-import-van-ban-giao-viec.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    }
    catch (err: any) {
      error.value = getErrorMessage(err, 'Tải file mẫu thất bại')
      throw err
    }
  }

  async function importDocuments(file: File) {
    try {
      isLoading.value = true

      const response = await documentApi.import(file)
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

  function setFilters(newFilters: Partial<DocumentFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = { page: 1, limit: 15, sort_by: 'created_at', sort_order: 'desc' }
  }

  return {
    documents,
    currentDocument,
    stats,
    isLoading,
    error,
    filters,
    meta,
    total,
    fetchStats,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    bulkDelete,
    bulkUpdateStatus,
    changeStatus,
    exportDocuments,
    downloadTemplate,
    importDocuments,
    setFilters,
    resetFilters,
  }
})
