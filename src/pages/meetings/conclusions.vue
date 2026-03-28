<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { meetingApi, type Meeting } from '@/api/modules/meeting'

definePage({
  meta: {
    action: 'index',
    subject: 'Meetings',
  },
})

const router = useRouter()
const meetings = ref<Meeting[]>([])
const isLoading = ref(false)

const fetchMeetings = async () => {
  isLoading.value = true
  try {
    const res = await meetingApi.list({ limit: 50, sort_by: 'start_at', sort_order: 'desc' })
    if (res.data.success)
      meetings.value = res.data.data ?? []
  }
  finally {
    isLoading.value = false
  }
}

onMounted(fetchMeetings)

const goToAgenda = (id: number) => {
  router.push({ name: 'meetings-id-agenda', params: { id } })
}

const resolveStatusVariant = (status: string) => {
  const variants: Record<string, string> = {
    draft: 'secondary',
    active: 'info',
    in_progress: 'warning',
    ended: 'success',
  }
  return variants[status] || 'secondary'
}

const resolveStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Nháp',
    active: 'Đã lên lịch',
    in_progress: 'Đang diễn ra',
    ended: 'Đã kết thúc',
  }
  return labels[status] || status
}
</script>

<template>
  <div>
    <h4 class="text-h4 mb-6">
      Soạn thảo Kết luận
    </h4>

    <VCard>
      <VCardTitle class="pa-4 pb-0 text-body-1 text-disabled">
        Chọn cuộc họp để soạn thảo kết luận
      </VCardTitle>

      <VCardText>
        <div
          v-if="isLoading"
          class="d-flex justify-center pa-10"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>

        <div
          v-else-if="meetings.length === 0"
          class="d-flex flex-column align-center py-12"
        >
          <VIcon
            icon="tabler-file-off"
            size="52"
            color="disabled"
            class="mb-4"
          />
          <div class="text-body-1 text-disabled">
            Chưa có cuộc họp nào
          </div>
        </div>

        <VList
          v-else
          lines="two"
        >
          <VListItem
            v-for="m in meetings"
            :key="m.id"
            class="py-3 cursor-pointer"
            rounded
            @click="goToAgenda(m.id)"
          >
            <template #prepend>
              <VAvatar
                color="primary"
                variant="tonal"
                rounded
                size="44"
                class="me-4"
              >
                <VIcon
                  icon="tabler-file-text"
                  size="22"
                />
              </VAvatar>
            </template>

            <VListItemTitle class="font-weight-medium">
              {{ m.title }}
            </VListItemTitle>
            <VListItemSubtitle>
              <VIcon
                icon="tabler-clock"
                size="14"
                class="me-1"
              />{{ m.start_at }}
              <span
                v-if="m.location"
                class="ms-3"
              >
                <VIcon
                  icon="tabler-map-pin"
                  size="14"
                  class="me-1"
                />{{ m.location }}
              </span>
            </VListItemSubtitle>

            <template #append>
              <VChip
                :color="resolveStatusVariant(m.status)"
                size="small"
              >
                {{ resolveStatusLabel(m.status) }}
              </VChip>
            </template>
          </VListItem>
        </VList>
      </VCardText>
    </VCard>
  </div>
</template>
