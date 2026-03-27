<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
// eslint-disable-next-line import/extensions, import/no-unresolved
import echo from '@/utils/echo'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { ATTENDANCE_STATUS_OPTIONS, MEETING_ROLE_OPTIONS, type Participant } from '@/api/modules/participant'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useParticipantStore } from '@/store/modules/participant'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { meetingApi } from '@/api/modules/meeting'
import type { Meeting } from '@/api/modules/meeting'

interface Props {
  meetingId: number
}

const props = defineProps<Props>()
const router = useRouter()
const participantStore = useParticipantStore()

// Meeting
const meeting = ref<Meeting | null>(null)

// Filters
const searchQuery = ref('')
const filterStatus = ref('')
const filterRole = ref('')

// Live: Echo connection state
const isInitialLoading = ref(true)
const isPolling = ref(false) // used for fallback poll spinner
const lastUpdatedAt = ref<Date | null>(null)
const isEchoConnected = ref(false)

// Fallback poll — only fires if Echo is disconnected
const FALLBACK_POLL_INTERVAL = 30000
let pollTimer: ReturnType<typeof setInterval> | null = null

// Status change dialog
const isStatusDialogVisible = ref(false)
const changingParticipant = ref<Participant | null>(null)
const pendingStatus = ref('')
const pendingAbsenceReason = ref('')
const isStatusSubmitting = ref(false)

// Toast
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

// Computed: filtered participants
const filteredParticipants = computed(() => {
  let list = participantStore.participants

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()

    list = list.filter(p =>
      p.user_name?.toLowerCase().includes(q)
      || p.user_email?.toLowerCase().includes(q)
      || p.position?.toLowerCase().includes(q),
    )
  }
  if (filterStatus.value)
    list = list.filter(p => p.attendance_status === filterStatus.value)
  if (filterRole.value)
    list = list.filter(p => p.meeting_role === filterRole.value)

  return list
})

// Computed: stats
const stats = computed(() => {
  const all = participantStore.participants
  const total = all.length
  const present = all.filter(p => p.attendance_status === 'present').length
  const absent = all.filter(p => p.attendance_status === 'absent').length
  const notArrived = all.filter(p => p.attendance_status === 'not_arrived').length
  const rate = total > 0 ? Math.round((present / total) * 100) : 0

  return { total, present, absent, notArrived, rate }
})

// Helpers
const resolveRoleLabel = (role: string) =>
  MEETING_ROLE_OPTIONS.find(r => r.value === role)?.title ?? role

const resolveRoleColor = (role: string): string =>
  ({ chair: 'error', secretary: 'warning', delegate: 'primary' }[role] ?? 'default')

const resolveStatusColor = (status: string): string =>
  ({ present: 'success', absent: 'error', not_arrived: 'secondary' }[status] ?? 'default')

const resolveStatusIcon = (status: string): string =>
  ({ present: 'tabler-circle-check-filled', absent: 'tabler-circle-x-filled', not_arrived: 'tabler-circle-dashed' }[status] ?? 'tabler-circle')

const resolveStatusLabel = (status: string) =>
  ATTENDANCE_STATUS_OPTIONS.find(s => s.value === status)?.title ?? status

const cardBorderColor = (status: string): string =>
  ({ present: 'rgb(var(--v-theme-success))', absent: 'rgb(var(--v-theme-error))', not_arrived: 'rgba(var(--v-theme-on-surface), 0.15)' }[status] ?? 'transparent')

const formattedTime = computed(() => {
  if (!lastUpdatedAt.value)
    return ''
  const d = lastUpdatedAt.value
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')

  return `${hh}:${mm}:${ss}`
})

// ─── Fetch (initial + fallback) ────────────────────────────────────────────
const fetchData = async (silent = false) => {
  if (!silent)
    isInitialLoading.value = true
  else
    isPolling.value = true

  try {
    const [meetingRes] = await Promise.all([
      silent ? Promise.resolve(null) : meetingApi.show(props.meetingId),
      participantStore.fetchParticipants(props.meetingId),
    ])

    if (meetingRes?.data.success)
      meeting.value = meetingRes.data.data ?? null
    lastUpdatedAt.value = new Date()
  }
  catch {
    if (!silent)
      showToast('Không thể tải dữ liệu.', 'error')
  }
  finally {
    isInitialLoading.value = false
    isPolling.value = false
  }
}

// ─── Echo: subscribe to Pusher channel ─────────────────────────────────────
const subscribeEcho = () => {
  const channel = echo.channel(`meetings.${props.meetingId}`)

  // Track connection state
  echo.connector.pusher.connection.bind('connected', () => {
    isEchoConnected.value = true
  })
  echo.connector.pusher.connection.bind('disconnected', () => {
    isEchoConnected.value = false
  })
  echo.connector.pusher.connection.bind('unavailable', () => {
    isEchoConnected.value = false
  })

  // Listen for attendance changes (dot-prefix = broadcastAs name)
  channel.listen('.ParticipantAttendanceChanged', (data: Participant) => {
    const idx = participantStore.participants.findIndex(p => p.id === data.id)
    if (idx !== -1)
      participantStore.participants[idx] = data
    else
      participantStore.participants.push(data)

    lastUpdatedAt.value = new Date()
  })
}

// Fallback polling (only while Echo is disconnected)
const startFallbackPoll = () => {
  pollTimer = setInterval(async () => {
    if (!isEchoConnected.value)
      await fetchData(true)
  }, FALLBACK_POLL_INTERVAL)
}

// Status change
const openStatusDialog = (participant: Participant, preStatus?: string) => {
  changingParticipant.value = participant
  pendingStatus.value = preStatus ?? participant.attendance_status
  pendingAbsenceReason.value = participant.absence_reason ?? ''
  isStatusDialogVisible.value = true
}

const onStatusConfirm = async () => {
  if (!changingParticipant.value)
    return
  isStatusSubmitting.value = true
  try {
    await participantStore.changeAttendanceStatus(props.meetingId, changingParticipant.value.id, {
      attendance_status: pendingStatus.value,
      absence_reason: pendingStatus.value === 'absent' ? (pendingAbsenceReason.value.trim() || null) : null,
    })
    lastUpdatedAt.value = new Date()
    showToast('Cập nhật điểm danh thành công!', 'success')
    isStatusDialogVisible.value = false
  }
  catch (err: any) {
    showToast(err?.response?.data?.message || 'Cập nhật thất bại.', 'error')
  }
  finally {
    isStatusSubmitting.value = false
    changingParticipant.value = null
  }
}

const goBack = () => router.push({ name: 'meetings' })

// Filter options
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const statusFilterOptions = [{ title: 'Tất cả', value: '' }, ...ATTENDANCE_STATUS_OPTIONS]
const roleFilterOptions = [{ title: 'Tất cả vai trò', value: '' }, ...MEETING_ROLE_OPTIONS]

onMounted(async () => {
  await fetchData(false)
  subscribeEcho()
  startFallbackPoll()
})

onUnmounted(() => {
  echo.leaveChannel(`meetings.${props.meetingId}`)
  if (pollTimer)
    clearInterval(pollTimer)
})
</script>

<template>
  <div>
    <!-- Header -->
    <VCard class="mb-5">
      <VCardText class="pa-4">
        <div class="d-flex align-center gap-3 flex-wrap">
          <VBtn
            variant="text"
            color="secondary"
            size="small"
            prepend-icon="tabler-arrow-left"
            @click="goBack"
          >
            Quay lại
          </VBtn>

          <VDivider
            vertical
            class="mx-1"
            style="height: 24px;"
          />

          <div class="flex-grow-1">
            <div class="d-flex align-center gap-2 mb-1">
              <VIcon
                icon="tabler-clipboard-check"
                color="primary"
                size="20"
              />
              <span class="text-h6 font-weight-bold">Bảng điểm danh</span>

              <!-- Live badge -->
              <VChip
                size="x-small"
                :color="isEchoConnected ? 'success' : 'warning'"
                class="live-badge ms-1"
              >
                <span class="live-dot me-1" />
                {{ isEchoConnected ? 'LIVE' : 'POLLING' }}
              </VChip>
            </div>
            <div
              v-if="meeting"
              class="text-body-2 text-medium-emphasis"
            >
              {{ meeting.title }}
            </div>
          </div>

          <!-- Last updated -->
          <div
            v-if="formattedTime"
            class="d-flex align-center gap-1 text-caption text-medium-emphasis"
          >
            <VIcon
              icon="tabler-refresh"
              size="14"
              :class="{ 'spin-icon': isPolling }"
            />
            {{ formattedTime }}
          </div>

          <VBtn
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="tabler-refresh"
            :loading="isInitialLoading"
            @click="fetchData(false)"
          >
            Làm mới
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- Stats -->
    <VRow class="mb-5">
      <VCol
        cols="6"
        lg="3"
      >
        <VCard
          class="cursor-pointer"
          :class="{ 'border-primary': filterStatus === '' }"
          border
          @click="filterStatus = ''"
        >
          <VCardText class="pa-4">
            <div class="d-flex justify-space-between align-start mb-3">
              <div>
                <div class="text-caption text-medium-emphasis mb-1">
                  Tổng đại biểu
                </div>
                <div class="text-h4 font-weight-bold">
                  {{ stats.total }}
                </div>
              </div>
              <VAvatar
                color="primary"
                variant="tonal"
                rounded
                size="42"
              >
                <VIcon
                  icon="tabler-users"
                  size="22"
                />
              </VAvatar>
            </div>
            <VProgressLinear
              :model-value="100"
              color="primary"
              bg-color="surface-variant"
              rounded
              height="4"
            />
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="6"
        lg="3"
      >
        <VCard
          class="cursor-pointer"
          :border="filterStatus === 'present'"
          :style="filterStatus === 'present' ? 'border-color: rgb(var(--v-theme-success)) !important' : ''"
          @click="filterStatus = filterStatus === 'present' ? '' : 'present'"
        >
          <VCardText class="pa-4">
            <div class="d-flex justify-space-between align-start mb-3">
              <div>
                <div class="text-caption text-medium-emphasis mb-1">
                  Có mặt
                </div>
                <div class="text-h4 font-weight-bold text-success">
                  {{ stats.present }}
                </div>
              </div>
              <VAvatar
                color="success"
                variant="tonal"
                rounded
                size="42"
              >
                <VIcon
                  icon="tabler-circle-check"
                  size="22"
                />
              </VAvatar>
            </div>
            <VProgressLinear
              :model-value="stats.rate"
              color="success"
              bg-color="surface-variant"
              rounded
              height="4"
            />
            <div class="text-caption text-medium-emphasis mt-1">
              {{ stats.rate }}% tỷ lệ có mặt
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="6"
        lg="3"
      >
        <VCard
          class="cursor-pointer"
          :border="filterStatus === 'absent'"
          :style="filterStatus === 'absent' ? 'border-color: rgb(var(--v-theme-error)) !important' : ''"
          @click="filterStatus = filterStatus === 'absent' ? '' : 'absent'"
        >
          <VCardText class="pa-4">
            <div class="d-flex justify-space-between align-start mb-3">
              <div>
                <div class="text-caption text-medium-emphasis mb-1">
                  Vắng mặt
                </div>
                <div class="text-h4 font-weight-bold text-error">
                  {{ stats.absent }}
                </div>
              </div>
              <VAvatar
                color="error"
                variant="tonal"
                rounded
                size="42"
              >
                <VIcon
                  icon="tabler-circle-x"
                  size="22"
                />
              </VAvatar>
            </div>
            <VProgressLinear
              :model-value="stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0"
              color="error"
              bg-color="surface-variant"
              rounded
              height="4"
            />
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="6"
        lg="3"
      >
        <VCard
          class="cursor-pointer"
          :border="filterStatus === 'not_arrived'"
          :style="filterStatus === 'not_arrived' ? 'border-color: rgb(var(--v-theme-secondary)) !important' : ''"
          @click="filterStatus = filterStatus === 'not_arrived' ? '' : 'not_arrived'"
        >
          <VCardText class="pa-4">
            <div class="d-flex justify-space-between align-start mb-3">
              <div>
                <div class="text-caption text-medium-emphasis mb-1">
                  Chưa đến
                </div>
                <div class="text-h4 font-weight-bold">
                  {{ stats.notArrived }}
                </div>
              </div>
              <VAvatar
                color="secondary"
                variant="tonal"
                rounded
                size="42"
              >
                <VIcon
                  icon="tabler-clock"
                  size="22"
                />
              </VAvatar>
            </div>
            <VProgressLinear
              :model-value="stats.total > 0 ? Math.round((stats.notArrived / stats.total) * 100) : 0"
              color="secondary"
              bg-color="surface-variant"
              rounded
              height="4"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Filters -->
    <VCard class="mb-4">
      <VCardText class="pa-4">
        <div class="d-flex align-center gap-3 flex-wrap">
          <AppTextField
            v-model="searchQuery"
            placeholder="Tìm tên, chức vụ..."
            prepend-inner-icon="tabler-search"
            style="min-width: 220px; max-width: 320px;"
            clearable
            density="compact"
          />
          <AppSelect
            v-model="filterRole"
            :items="roleFilterOptions"
            item-title="title"
            item-value="value"
            style="min-width: 160px;"
            density="compact"
          />
          <div class="text-caption text-medium-emphasis ms-auto">
            Hiển thị {{ filteredParticipants.length }} / {{ stats.total }} đại biểu
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Participant Cards Grid -->
    <div v-if="isInitialLoading">
      <VRow>
        <VCol
          v-for="i in 6"
          :key="i"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <VSkeletonLoader type="card" />
        </VCol>
      </VRow>
    </div>

    <div v-else-if="filteredParticipants.length === 0">
      <VCard>
        <VCardText class="d-flex flex-column align-center py-12 text-medium-emphasis">
          <VIcon
            icon="tabler-clipboard-off"
            size="52"
            class="mb-3"
            opacity="0.4"
          />
          <p>Không có đại biểu nào phù hợp</p>
        </VCardText>
      </VCard>
    </div>

    <VRow v-else>
      <VCol
        v-for="participant in filteredParticipants"
        :key="participant.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <VCard
          class="participant-card h-100"
          :style="{ borderLeft: `4px solid ${cardBorderColor(participant.attendance_status)}` }"
          :class="{ 'present-card': participant.attendance_status === 'present' }"
        >
          <VCardText class="pa-4">
            <!-- Avatar + Name -->
            <div class="d-flex align-start gap-3 mb-3">
              <VAvatar
                :color="resolveStatusColor(participant.attendance_status)"
                size="44"
                variant="tonal"
              >
                <span class="text-body-1 font-weight-bold">
                  {{ participant.user_name?.charAt(0)?.toUpperCase() ?? '?' }}
                </span>
              </VAvatar>
              <div class="flex-grow-1 overflow-hidden">
                <div
                  class="font-weight-semibold text-truncate"
                  :title="participant.user_name ?? ''"
                >
                  {{ participant.user_name ?? 'Không rõ' }}
                </div>
                <div class="text-caption text-medium-emphasis text-truncate">
                  {{ participant.position }}
                </div>
              </div>

              <!-- Status icon -->
              <VIcon
                :icon="resolveStatusIcon(participant.attendance_status)"
                :color="resolveStatusColor(participant.attendance_status)"
                size="22"
              />
            </div>

            <!-- Role chip -->
            <div class="d-flex align-center justify-space-between">
              <VChip
                :color="resolveRoleColor(participant.meeting_role)"
                size="x-small"
                variant="tonal"
              >
                {{ resolveRoleLabel(participant.meeting_role) }}
              </VChip>

              <VChip
                :color="resolveStatusColor(participant.attendance_status)"
                size="x-small"
                variant="tonal"
              >
                {{ resolveStatusLabel(participant.attendance_status) }}
              </VChip>
            </div>

            <!-- Checkin time -->
            <div
              v-if="participant.checkin_at"
              class="d-flex align-center gap-1 mt-2 text-caption text-medium-emphasis"
            >
              <VIcon
                icon="tabler-clock"
                size="12"
              />
              {{ participant.checkin_at }}
            </div>

            <!-- Absence reason -->
            <div
              v-if="participant.absence_reason"
              class="mt-2 text-caption text-error text-truncate"
              :title="participant.absence_reason"
            >
              {{ participant.absence_reason }}
            </div>
          </VCardText>

          <!-- Action footer -->
          <VDivider />
          <VCardActions class="pa-2 gap-1">
            <VBtn
              v-if="participant.attendance_status !== 'present'"
              size="x-small"
              color="success"
              variant="tonal"
              prepend-icon="tabler-circle-check"
              @click="openStatusDialog(participant, 'present')"
            >
              Có mặt
            </VBtn>
            <VBtn
              v-if="participant.attendance_status !== 'absent'"
              size="x-small"
              color="error"
              variant="tonal"
              prepend-icon="tabler-circle-x"
              @click="openStatusDialog(participant, 'absent')"
            >
              Vắng
            </VBtn>
            <VSpacer />
            <IconBtn
              size="x-small"
              @click="openStatusDialog(participant)"
            >
              <VIcon
                icon="tabler-edit"
                size="16"
              />
            </IconBtn>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>

    <!-- Status Change Dialog -->
    <VDialog
      v-model="isStatusDialogVisible"
      max-width="440"
      @after-leave="changingParticipant = null"
    >
      <VCard v-if="changingParticipant">
        <VCardTitle class="pa-5 pb-3">
          <div class="d-flex align-center gap-3">
            <VAvatar
              color="primary"
              size="36"
              variant="tonal"
            >
              <span class="text-body-2 font-weight-bold">
                {{ changingParticipant.user_name?.charAt(0)?.toUpperCase() ?? '?' }}
              </span>
            </VAvatar>
            <div>
              <div class="text-subtitle-1 font-weight-semibold">
                {{ changingParticipant.user_name }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ changingParticipant.position }}
              </div>
            </div>
          </div>
        </VCardTitle>

        <VCardText class="px-5 pb-2">
          <div class="text-subtitle-2 mb-3">
            Chọn trạng thái điểm danh
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <VBtn
              v-for="opt in ATTENDANCE_STATUS_OPTIONS"
              :key="opt.value"
              :color="resolveStatusColor(opt.value)"
              :variant="pendingStatus === opt.value ? 'elevated' : 'tonal'"
              :prepend-icon="resolveStatusIcon(opt.value)"
              @click="pendingStatus = opt.value"
            >
              {{ opt.title }}
            </VBtn>
          </div>

          <AppTextarea
            v-if="pendingStatus === 'absent'"
            v-model="pendingAbsenceReason"
            label="Lý do vắng mặt"
            placeholder="Nhập lý do (không bắt buộc)..."
            rows="2"
            class="mt-4"
            :rules="[(v: string) => !v || v.length <= 500 || 'Tối đa 500 ký tự']"
          />
        </VCardText>

        <VCardActions class="pa-5 pt-3 gap-2 justify-end">
          <VBtn
            variant="tonal"
            color="secondary"
            :disabled="isStatusSubmitting"
            @click="isStatusDialogVisible = false"
          >
            Hủy
          </VBtn>
          <VBtn
            :color="resolveStatusColor(pendingStatus)"
            :loading="isStatusSubmitting"
            @click="onStatusConfirm"
          >
            Xác nhận
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Toast -->
    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="top end"
      :timeout="3000"
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
.live-badge {
  animation: pulse-badge 2s ease-in-out infinite;
}

.live-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

@keyframes pulse-badge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.participant-card {
  transition: box-shadow 0.2s, transform 0.2s;
}

.participant-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.present-card {
  background: rgba(var(--v-theme-success), 0.04);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
