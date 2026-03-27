import { defineStore } from 'pinia'
import { ref } from 'vue'
// eslint-disable-next-line import/extensions
import { type Participant, participantApi } from '@/api/modules/participant'

export const useParticipantStore = defineStore('participant', () => {
  // State
  const participants = ref<Participant[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchParticipants(meetingId: number, params?: { search?: string }) {
    try {
      isLoading.value = true
      error.value = null

      const response = await participantApi.list(meetingId, params)
      if (response.data.success)
        participants.value = response.data.data || []
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Lấy danh sách đại biểu thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function addParticipants(meetingId: number, data: { user_ids: number[]; meeting_role: string; position: string }) {
    try {
      isLoading.value = true

      const response = await participantApi.store(meetingId, data)
      if (response.data.success && response.data.data) {
        // Append newly added (skip duplicates already in list)
        const existingIds = new Set(participants.value.map(p => p.user_id))
        const newOnes = response.data.data.filter(p => !existingIds.has(p.user_id))

        participants.value.push(...newOnes)

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Thêm đại biểu thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateParticipant(meetingId: number, participantId: number, data: { meeting_role?: string; position?: string }) {
    try {
      isLoading.value = true

      const response = await participantApi.update(meetingId, participantId, data)
      if (response.data.success && response.data.data) {
        const index = participants.value.findIndex(p => p.id === participantId)
        if (index !== -1)
          participants.value[index] = response.data.data!

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Cập nhật đại biểu thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function deleteParticipant(meetingId: number, participantId: number) {
    try {
      isLoading.value = true
      await participantApi.delete(meetingId, participantId)
      participants.value = participants.value.filter(p => p.id !== participantId)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xóa đại biểu thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function changeAttendanceStatus(
    meetingId: number,
    participantId: number,
    data: { attendance_status: string; absence_reason?: string | null },
  ) {
    try {
      isLoading.value = true

      const response = await participantApi.changeStatus(meetingId, participantId, data)
      if (response.data.success && response.data.data) {
        const index = participants.value.findIndex(p => p.id === participantId)
        if (index !== -1)
          participants.value[index] = response.data.data!

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Cập nhật điểm danh thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function bulkUpdateAttendance(meetingId: number, ids: number[], attendanceStatus: string) {
    try {
      isLoading.value = true
      await participantApi.bulkUpdateStatus(meetingId, ids, attendanceStatus)

      // Optimistic update
      participants.value = participants.value.map(p =>
        ids.includes(p.id) ? { ...p, attendance_status: attendanceStatus as Participant['attendance_status'] } : p,
      )
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Cập nhật điểm danh hàng loạt thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function bulkDeleteParticipants(meetingId: number, ids: number[]) {
    try {
      isLoading.value = true
      await participantApi.bulkDelete(meetingId, ids)
      participants.value = participants.value.filter(p => !ids.includes(p.id))
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xóa hàng loạt đại biểu thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  function reset() {
    participants.value = []
    error.value = null
    isLoading.value = false
  }

  return {
    participants,
    isLoading,
    error,
    fetchParticipants,
    addParticipants,
    updateParticipant,
    deleteParticipant,
    bulkDeleteParticipants,
    changeAttendanceStatus,
    bulkUpdateAttendance,
    reset,
  }
})
