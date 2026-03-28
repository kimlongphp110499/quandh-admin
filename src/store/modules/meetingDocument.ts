import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type MeetingDocument, meetingDocumentApi } from '@/api/modules/meetingDocument'

export const useMeetingDocumentStore = defineStore('meetingDocument', () => {
  const documents = ref<MeetingDocument[]>([])
  const isLoading = ref(false)
  const isUploading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDocuments(meetingId: number) {
    try {
      isLoading.value = true
      error.value = null
      const response = await meetingDocumentApi.list(meetingId)
      if (response.data.success)
        documents.value = response.data.data || []
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Lấy danh sách tài liệu thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function uploadDocuments(meetingId: number, files: File[], name?: string, type?: string) {
    try {
      isUploading.value = true
      error.value = null
      const response = await meetingDocumentApi.upload(meetingId, files, name, type)
      if (response.data.success && response.data.data)
        documents.value.unshift(...response.data.data)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Tải lên tài liệu thất bại'
      throw err
    }
    finally {
      isUploading.value = false
    }
  }

  async function deleteDocument(meetingId: number, documentId: number) {
    try {
      isLoading.value = true
      await meetingDocumentApi.delete(meetingId, documentId)
      documents.value = documents.value.filter(d => d.id !== documentId)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xóa tài liệu thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function previewDocument(meetingId: number, documentId: number) {
    const response = await meetingDocumentApi.preview(meetingId, documentId)
    const contentType = response.headers['content-type'] || 'application/octet-stream'
    const blob = new Blob([response.data], { type: contentType })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    // Revoke sau 60 giây để giải phóng bộ nhớ
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  function reset() {
    documents.value = []
    error.value = null
  }

  return {
    documents,
    isLoading,
    isUploading,
    error,
    fetchDocuments,
    uploadDocuments,
    deleteDocument,
    previewDocument,
    reset,
  }
})
