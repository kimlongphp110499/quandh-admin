<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { MEETING_ROLE_OPTIONS, type Participant, participantApi } from '@/api/modules/participant'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { meetingApi } from '@/api/modules/meeting'
import type { Meeting } from '@/api/modules/meeting'

interface Props {
  meetingId: number
}

const props = defineProps<Props>()

// Meeting info
const meeting = ref<Meeting | null>(null)

// Participants
const participants = ref<Participant[]>([])
const isLoading = ref(true)

// Search
const searchQuery = ref('')

// Checkin flow
const confirmingParticipant = ref<Participant | null>(null)
const isCheckinSubmitting = ref(false)
const checkedInParticipant = ref<Participant | null>(null)
const showSuccess = ref(false)

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'error' })

// Polling
const POLL_INTERVAL = 6000
let pollTimer: ReturnType<typeof setInterval> | null = null

// Computed: filtered list (only show participants based on search)
const filteredParticipants = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q)
    return participants.value

  return participants.value.filter(p =>
    p.user_name?.toLowerCase().includes(q)
    || p.position?.toLowerCase().includes(q),
  )
})

// Helpers
const resolveRoleLabel = (role: string) =>
  MEETING_ROLE_OPTIONS.find(r => r.value === role)?.title ?? role

const resolveRoleColor = (role: string): string =>
  ({ chair: 'error', secretary: 'warning', delegate: 'primary' }[role] ?? 'default')

const statusConfig = {
  present: { label: 'Đã có mặt', color: 'success', icon: 'tabler-circle-check-filled', bgClass: 'status-present' },
  absent: { label: 'Vắng mặt', color: 'error', icon: 'tabler-circle-x-filled', bgClass: 'status-absent' },
  not_arrived: { label: 'Chưa điểm danh', color: 'secondary', icon: 'tabler-circle-dashed', bgClass: 'status-waiting' },
}

const getStatusConfig = (status: string) =>
  statusConfig[status as keyof typeof statusConfig] ?? statusConfig.not_arrived

// Fetch data
const fetchAll = async (silent = false) => {
  if (!silent)
    isLoading.value = true
  try {
    const [meetRes, partRes] = await Promise.all([
      silent ? Promise.resolve(null) : meetingApi.show(props.meetingId),
      participantApi.list(props.meetingId),
    ])

    if (meetRes?.data.success)
      meeting.value = meetRes.data.data ?? null
    if (partRes.data.success)
      participants.value = partRes.data.data || []
  }
  finally {
    isLoading.value = false
  }
}

// Checkin actions
const openConfirm = (participant: Participant) => {
  if (participant.attendance_status !== 'not_arrived')
    return
  confirmingParticipant.value = participant
}

const cancelConfirm = () => {
  confirmingParticipant.value = null
}

const doCheckin = async () => {
  if (!confirmingParticipant.value)
    return
  isCheckinSubmitting.value = true
  try {
    const res = await participantApi.checkin(props.meetingId, confirmingParticipant.value.id, {
      attendance_status: 'present',
    })

    if (res.data.success && res.data.data) {
      // Update local list
      const idx = participants.value.findIndex(p => p.id === res.data.data!.id)
      if (idx !== -1)
        participants.value[idx] = res.data.data!

      checkedInParticipant.value = res.data.data!
      showSuccess.value = true
      confirmingParticipant.value = null
      searchQuery.value = ''

      // Auto-close success after 4 seconds
      setTimeout(() => {
        showSuccess.value = false
        checkedInParticipant.value = null
      }, 4000)
    }
  }
  catch (err: any) {
    const msg = err?.response?.data?.message || 'Điểm danh thất bại, vui lòng thử lại.'

    snackbar.value = { show: true, message: msg, color: 'error' }
    confirmingParticipant.value = null
  }
  finally {
    isCheckinSubmitting.value = false
  }
}

// Stats for display at bottom
const stats = computed(() => {
  const all = participants.value
  const total = all.length
  const present = all.filter(p => p.attendance_status === 'present').length

  return { total, present, rate: total > 0 ? Math.round((present / total) * 100) : 0 }
})

// Current time
const currentTime = ref('')
let clockTimer: ReturnType<typeof setInterval> | null = null

const updateClock = () => {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')

  currentTime.value = `${hh}:${mm}:${ss}`
}

onMounted(async () => {
  await fetchAll(false)
  pollTimer = setInterval(() => fetchAll(true), POLL_INTERVAL)
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (pollTimer)
    clearInterval(pollTimer)
  if (clockTimer)
    clearInterval(clockTimer)
})
</script>

<template>
  <div class="kiosk-wrapper">
    <!-- Loading skeleton -->
    <div
      v-if="isLoading"
      class="d-flex justify-center align-center"
      style="min-height: 400px;"
    >
      <div class="text-center">
        <VProgressCircular
          indeterminate
          color="primary"
          size="56"
        />
        <p class="mt-4 text-body-1 text-medium-emphasis">
          Đang tải dữ liệu...
        </p>
      </div>
    </div>

    <template v-else>
      <!-- Kiosk Header -->
      <VCard
        class="mb-6 kiosk-header"
        color="primary"
        variant="flat"
      >
        <VCardText class="pa-6">
          <div class="d-flex align-center justify-space-between flex-wrap gap-4">
            <div>
              <div class="d-flex align-center gap-2 mb-1">
                <VIcon
                  icon="tabler-clipboard-check"
                  color="white"
                  size="26"
                />
                <span class="text-h5 font-weight-bold text-white">Điểm danh đại biểu</span>
              </div>
              <div
                v-if="meeting"
                class="text-body-1 text-white"
                style="opacity: 0.85;"
              >
                {{ meeting.title }}
              </div>
            </div>

            <!-- Clock + Progress -->
            <div class="text-right">
              <div class="text-h4 font-weight-bold text-white font-mono">
                {{ currentTime }}
              </div>
              <div
                class="text-caption text-white mt-1"
                style="opacity: 0.75;"
              >
                {{ stats.present }} / {{ stats.total }} đã điểm danh ({{ stats.rate }}%)
              </div>
              <VProgressLinear
                :model-value="stats.rate"
                color="white"
                bg-color="rgba(255,255,255,0.25)"
                rounded
                height="6"
                class="mt-2"
                style="min-width: 180px;"
              />
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Search box -->
      <VCard class="mb-6">
        <VCardText class="pa-5">
          <div class="text-h6 font-weight-medium mb-3">
            Tìm kiếm tên của bạn
          </div>
          <AppTextField
            v-model="searchQuery"
            placeholder="Nhập tên hoặc chức vụ để tìm kiếm..."
            prepend-inner-icon="tabler-search"
            clearable
            autofocus
            variant="outlined"
            density="comfortable"
            style="font-size: 1.1rem;"
            hide-details
          />
          <div class="text-caption text-medium-emphasis mt-2">
            Tìm thấy {{ filteredParticipants.length }} đại biểu
          </div>
        </VCardText>
      </VCard>

      <!-- Participant grid -->
      <VRow>
        <VCol
          v-for="participant in filteredParticipants"
          :key="participant.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <VCard
            class="kiosk-card h-100"
            :class="[
              getStatusConfig(participant.attendance_status).bgClass,
              { 'can-checkin': participant.attendance_status === 'not_arrived' },
            ]"
            @click="openConfirm(participant)"
          >
            <VCardText class="pa-5 d-flex flex-column align-center text-center">
              <!-- Avatar -->
              <VAvatar
                :color="getStatusConfig(participant.attendance_status).color"
                size="64"
                class="mb-3"
              >
                <span class="text-h5 font-weight-bold text-white">
                  {{ participant.user_name?.charAt(0)?.toUpperCase() ?? '?' }}
                </span>
              </VAvatar>

              <!-- Name -->
              <div class="text-subtitle-1 font-weight-semibold mb-1">
                {{ participant.user_name ?? 'Không rõ' }}
              </div>

              <!-- Position -->
              <div class="text-caption text-medium-emphasis mb-3">
                {{ participant.position }}
              </div>

              <!-- Role + Status -->
              <div class="d-flex gap-2 flex-wrap justify-center mb-3">
                <VChip
                  :color="resolveRoleColor(participant.meeting_role)"
                  size="x-small"
                  variant="tonal"
                >
                  {{ resolveRoleLabel(participant.meeting_role) }}
                </VChip>
              </div>

              <!-- Status badge -->
              <div
                class="status-badge d-flex align-center gap-1"
                :class="`text-${getStatusConfig(participant.attendance_status).color}`"
              >
                <VIcon
                  :icon="getStatusConfig(participant.attendance_status).icon"
                  size="18"
                />
                <span class="text-caption font-weight-medium">
                  {{ getStatusConfig(participant.attendance_status).label }}
                </span>
              </div>

              <!-- Checkin time -->
              <div
                v-if="participant.checkin_at"
                class="text-caption text-medium-emphasis mt-1"
              >
                {{ participant.checkin_at }}
              </div>

              <!-- CTA button -->
              <VBtn
                v-if="participant.attendance_status === 'not_arrived'"
                color="primary"
                class="mt-4"
                block
                prepend-icon="tabler-circle-check"
              >
                Bấm để điểm danh
              </VBtn>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Empty state -->
        <VCol
          v-if="filteredParticipants.length === 0"
          cols="12"
        >
          <VCard>
            <VCardText class="d-flex flex-column align-center py-12 text-medium-emphasis">
              <VIcon
                icon="tabler-user-search"
                size="52"
                class="mb-3"
                opacity="0.4"
              />
              <p>{{ searchQuery ? `Không tìm thấy đại biểu với từ khóa "${searchQuery}"` : 'Chưa có đại biểu nào' }}</p>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </template>

    <!-- Confirm Dialog -->
    <VDialog
      v-model="confirmingParticipant"
      max-width="400"
      persistent
    >
      <VCard v-if="confirmingParticipant">
        <VCardText class="d-flex flex-column align-center pa-8 text-center">
          <VAvatar
            color="primary"
            size="80"
            class="mb-4"
          >
            <span class="text-h4 font-weight-bold text-white">
              {{ confirmingParticipant.user_name?.charAt(0)?.toUpperCase() ?? '?' }}
            </span>
          </VAvatar>

          <div class="text-h6 font-weight-bold mb-1">
            {{ confirmingParticipant.user_name }}
          </div>
          <div class="text-body-2 text-medium-emphasis mb-1">
            {{ confirmingParticipant.position }}
          </div>
          <VChip
            :color="resolveRoleColor(confirmingParticipant.meeting_role)"
            size="small"
            variant="tonal"
            class="mb-5"
          >
            {{ resolveRoleLabel(confirmingParticipant.meeting_role) }}
          </VChip>

          <div class="text-body-1 mb-6">
            Bạn xác nhận có mặt tại cuộc họp này?
          </div>

          <div class="d-flex gap-3 w-100">
            <VBtn
              variant="tonal"
              color="secondary"
              class="flex-grow-1"
              :disabled="isCheckinSubmitting"
              @click="cancelConfirm"
            >
              Hủy
            </VBtn>
            <VBtn
              color="success"
              class="flex-grow-1"
              prepend-icon="tabler-circle-check"
              :loading="isCheckinSubmitting"
              @click="doCheckin"
            >
              Xác nhận có mặt
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Success overlay -->
    <VDialog
      v-model="showSuccess"
      max-width="400"
    >
      <VCard v-if="checkedInParticipant">
        <VCardText class="d-flex flex-column align-center pa-8 text-center">
          <VIcon
            icon="tabler-circle-check-filled"
            color="success"
            size="80"
            class="mb-4"
          />
          <div class="text-h6 font-weight-bold text-success mb-2">
            Điểm danh thành công!
          </div>
          <div class="text-body-1 font-weight-medium mb-1">
            {{ checkedInParticipant.user_name }}
          </div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            {{ checkedInParticipant.position }}
          </div>
          <VChip
            color="success"
            size="small"
            variant="tonal"
            prepend-icon="tabler-clock"
          >
            {{ checkedInParticipant.checkin_at }}
          </VChip>
          <div class="text-caption text-medium-emphasis mt-4">
            Cửa sổ này sẽ tự đóng sau vài giây...
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Error snackbar -->
    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="top"
      :timeout="4000"
    >
      {{ snackbar.message }}
      <template #actions>
        <VBtn
          variant="text"
          @click="snackbar.show = false"
        >
          Đóng
        </VBtn>
      </template>
    </VSnackbar>
  </div>
</template>

<style scoped>
.kiosk-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.8) 100%);
}

.kiosk-card {
  transition: box-shadow 0.2s, transform 0.2s;
  border: 2px solid transparent;
}

.kiosk-card.can-checkin {
  cursor: pointer;
  border-color: rgb(var(--v-theme-primary));
}

.kiosk-card.can-checkin:hover {
  box-shadow: 0 6px 24px rgba(var(--v-theme-primary), 0.25);
  transform: translateY(-3px);
}

.status-present {
  background-color: rgba(var(--v-theme-success), 0.06) !important;
  border-color: rgba(var(--v-theme-success), 0.3) !important;
}

.status-absent {
  background-color: rgba(var(--v-theme-error), 0.06) !important;
  border-color: rgba(var(--v-theme-error), 0.2) !important;
}

.status-waiting {
  border-color: rgb(var(--v-theme-primary)) !important;
}

.font-mono {
  font-family: 'Courier New', Courier, monospace;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.05);
}
</style>
