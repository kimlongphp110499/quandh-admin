import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { meetingApi, type Meeting, type MeetingFilters } from '@/api/modules/meeting'

export const useMeetingStore = defineStore('meeting', () => {
  // State
  const meetings = ref<Meeting[]>([])
  const currentMeeting = ref<Meeting | null>(null)
  const stats = ref<any>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<MeetingFilters>({
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
  })
  const meta = ref<any>(null)

  // Getters
  const totalMeetings = computed(() => meta.value?.total || 0)
  const draftMeetings = computed(() => meetings.value.filter(m => m.status === 'draft'))
  const activeMeetings = computed(() => meetings.value.filter(m => m.status === 'active'))

  // Actions
  async function fetchStats(customFilters?: MeetingFilters) {
    try {
      isLoading.value = true
      const response = await meetingApi.stats({ ...filters.value, ...customFilters })
      
      if (response.data.success) {
        stats.value = response.data.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Lấy thống kê thất bại'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMeetings(customFilters?: MeetingFilters) {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await meetingApi.list({ ...filters.value, ...customFilters })
      
      if (response.data.success) {
        meetings.value = response.data.data || []
        meta.value = response.data.meta
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Lấy danh sách cuộc họp thất bại'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMeeting(id: number) {
    try {
      isLoading.value = true
      const response = await meetingApi.show(id)
      
      if (response.data.success && response.data.data) {
        currentMeeting.value = response.data.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Lấy chi tiết cuộc họp thất bại'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createMeeting(data: Partial<Meeting>) {
    try {
      isLoading.value = true
      const response = await meetingApi.create(data)
      
      if (response.data.success && response.data.data) {
        meetings.value.unshift(response.data.data)
        return response.data.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Tạo cuộc họp thất bại'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateMeeting(id: number, data: Partial<Meeting>) {
    try {
      isLoading.value = true
      const response = await meetingApi.update(id, data)
      
      if (response.data.success && response.data.data) {
        const index = meetings.value.findIndex(m => m.id === id)
        if (index !== -1)
          meetings.value[index] = response.data.data
        
        if (currentMeeting.value?.id === id)
          currentMeeting.value = response.data.data
        
        return response.data.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Cập nhật cuộc họp thất bại'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteMeeting(id: number) {
    try {
      isLoading.value = true
      await meetingApi.delete(id)
      
      meetings.value = meetings.value.filter(m => m.id !== id)
      if (currentMeeting.value?.id === id)
        currentMeeting.value = null
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Xóa cuộc họp thất bại'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function changeStatus(id: number, status: Meeting['status']) {
    try {
      isLoading.value = true
      const response = await meetingApi.changeStatus(id, status)
      
      if (response.data.success && response.data.data) {
        const index = meetings.value.findIndex(m => m.id === id)
        if (index !== -1)
          meetings.value[index] = response.data.data
        
        return response.data.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Thay đổi trạng thái thất bại'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function bulkDelete(ids: number[]) {
    try {
      isLoading.value = true
      await meetingApi.bulkDelete(ids)
      meetings.value = meetings.value.filter(m => !ids.includes(m.id))
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Xóa hàng loạt thất bại'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function bulkUpdateStatus(ids: number[], status: Meeting['status']) {
    try {
      isLoading.value = true
      await meetingApi.bulkUpdateStatus(ids, status)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Cập nhật trạng thái hàng loạt thất bại'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function exportMeetings(exportFilters?: MeetingFilters) {
    try {
      const { page: _page, limit: _limit, ...baseFilters } = filters.value
      const response = await meetingApi.export({ ...baseFilters, ...exportFilters })
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meetings_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Xuất danh sách thất bại'
      throw err
    }
  }

  async function importMeetings(file: File) {
    try {
      isLoading.value = true
      const response = await meetingApi.import(file)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Nhập danh sách thất bại'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function setFilters(newFilters: Partial<MeetingFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = {
      limit: 10,
      sort_by: 'created_at',
      sort_order: 'desc',
    }
  }

  return {
    // State
    meetings,
    currentMeeting,
    stats,
    isLoading,
    error,
    filters,
    meta,
    
    // Getters
    totalMeetings,
    draftMeetings,
    activeMeetings,
    
    // Actions
    fetchStats,
    fetchMeetings,
    fetchMeeting,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    changeStatus,
    bulkDelete,
    bulkUpdateStatus,
    exportMeetings,
    importMeetings,
    setFilters,
    resetFilters,
  }
})
