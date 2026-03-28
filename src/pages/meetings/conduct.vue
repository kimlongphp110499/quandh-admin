<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

const fetchActive = async () => {
  isLoading.value = true
  try {
    const res = await meetingApi.list({ status: 'in_progress', limit: 50, sort_by: 'start_at', sort_order: 'asc' })
    if (res.data.success)
      meetings.value = res.data.data ?? []
  }
  finally {
    isLoading.value = false
  }
}

onMounted(fetchActive)

const goToMeeting = (id: number) => {
  router.push({ name: 'meetings-id-attendance', params: { id } })
}
</script>

<template>
  <div>
    <h4 class="text-h4 mb-6">
      Điều hành Cuộc họp
    </h4>

    <VCard>
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
            icon="tabler-calendar-off"
            size="52"
            color="disabled"
            class="mb-4"
          />
          <div class="text-body-1 text-disabled">
            Không có cuộc họp nào đang diễn ra
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
            @click="goToMeeting(m.id)"
          >
            <template #prepend>
              <VAvatar
                color="warning"
                variant="tonal"
                rounded
                size="44"
                class="me-4"
              >
                <VIcon
                  icon="tabler-presentation"
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
                color="warning"
                size="small"
              >
                Đang diễn ra
              </VChip>
            </template>
          </VListItem>
        </VList>
      </VCardText>
    </VCard>
  </div>
</template>
