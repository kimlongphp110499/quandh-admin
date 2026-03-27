import { defineStore } from 'pinia'
import { ref } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { type Agenda, type AgendaReorderItem, agendaApi } from '@/api/modules/agenda'

export const useAgendaStore = defineStore('agenda', () => {
  // State
  const agendas = ref<Agenda[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchAgendas(meetingId: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await agendaApi.list(meetingId)
      if (response.data.success)
        agendas.value = response.data.data || []
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Lấy danh sách chương trình thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function createAgenda(meetingId: number, data: Partial<Agenda>) {
    try {
      isLoading.value = true

      const response = await agendaApi.create(meetingId, data)
      if (response.data.success && response.data.data) {
        agendas.value.push(response.data.data)

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Tạo mục chương trình thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateAgenda(meetingId: number, agendaId: number, data: Partial<Agenda>) {
    try {
      isLoading.value = true

      const response = await agendaApi.update(meetingId, agendaId, data)
      if (response.data.success && response.data.data) {
        const index = agendas.value.findIndex(a => a.id === agendaId)
        if (index !== -1)
          agendas.value[index] = response.data.data!

        return response.data.data
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Cập nhật mục chương trình thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function deleteAgenda(meetingId: number, agendaId: number) {
    try {
      isLoading.value = true
      await agendaApi.delete(meetingId, agendaId)
      agendas.value = agendas.value.filter(a => a.id !== agendaId)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Xóa mục chương trình thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function setCurrentAgenda(meetingId: number, agendaId: number) {
    try {
      isLoading.value = true

      const response = await agendaApi.setCurrent(meetingId, agendaId)
      if (response.data.success) {
        agendas.value = agendas.value.map(a => ({
          ...a,
          is_current: a.id === agendaId,
        }))
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Đặt mục hiện tại thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function reorderAgendas(meetingId: number, orders: AgendaReorderItem[]) {
    try {
      await agendaApi.reorder(meetingId, orders)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Sắp xếp chương trình thất bại'
      throw err
    }
  }

  function reset() {
    agendas.value = []
    error.value = null
    isLoading.value = false
  }

  return {
    agendas,
    isLoading,
    error,
    fetchAgendas,
    createAgenda,
    updateAgenda,
    deleteAgenda,
    setCurrentAgenda,
    reorderAgendas,
    reset,
  }
})
