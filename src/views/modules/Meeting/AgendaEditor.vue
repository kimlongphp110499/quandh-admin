<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDragAndDrop } from '@formkit/drag-and-drop/vue'
import AgendaFormDrawer from './AgendaFormDrawer.vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useAgendaStore } from '@/store/modules/agenda'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { meetingApi } from '@/api/modules/meeting'
import type { Agenda } from '@/api/modules/agenda'
import type { Meeting } from '@/api/modules/meeting'

interface Props {
  meetingId: number
}

const props = defineProps<Props>()
const router = useRouter()
const agendaStore = useAgendaStore()

// Meeting info
const meeting = ref<Meeting | null>(null)
const isMeetingLoading = ref(false)

// Drawer
const isFormDrawerVisible = ref(false)
const editingAgenda = ref<Agenda | null>(null)

// Delete dialog
const isDeleteDialogVisible = ref(false)
const deletingId = ref<number | null>(null)

// Set current dialog
const isSetCurrentDialogVisible = ref(false)
const settingCurrentId = ref<number | null>(null)

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

// Drag-and-drop
// dragItems is the source of truth for display order.
// We ONLY update dragItems when explicitly fetching (never via watchers).
const [dragParent, dragItems] = useDragAndDrop<Agenda>([], {
  dragHandle: '.drag-handle',
  draggingClass: 'agenda-dragging',
  dropZoneClass: 'agenda-dropzone',
})

// Snapshot of IDs before drag starts – used to detect if order changed
const orderSnapshot = ref<number[]>([])

// Computed
const isLoading = computed(() => agendaStore.isLoading)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const totalDuration = computed(() => {
  return dragItems.value.reduce((sum, a) => sum + (a.duration || 0), 0)
})

// Methods
const syncItemsFromStore = () => {
  dragItems.value = [...agendaStore.agendas]
  orderSnapshot.value = agendaStore.agendas.map(a => a.id)
}

const fetchMeeting = async () => {
  isMeetingLoading.value = true
  try {
    const response = await meetingApi.show(props.meetingId)
    if (response.data.success && response.data.data)
      meeting.value = response.data.data
  }
  catch {
    showToast('Không thể tải thông tin cuộc họp!', 'error')
  }
  finally {
    isMeetingLoading.value = false
  }
}

const fetchAgendas = async () => {
  await agendaStore.fetchAgendas(props.meetingId)
  syncItemsFromStore()
}

// Called when native dragend event bubbles up to the container
const onDragEnd = async () => {
  await nextTick()

  const newOrder = dragItems.value.map(a => a.id)
  const hasChanged = newOrder.some((id, i) => id !== orderSnapshot.value[i])

  if (!hasChanged)
    return

  const orders = dragItems.value.map((item, index) => ({
    id: item.id,
    order_index: index,
  }))

  // Optimistic: update snapshot immediately
  orderSnapshot.value = [...newOrder]

  try {
    await agendaStore.reorderAgendas(props.meetingId, orders)
    showToast('Sắp xếp chương trình thành công!', 'success')
  }
  catch {
    showToast('Sắp xếp thất bại, đang khôi phục...', 'error')
    await fetchAgendas()
  }
}

const openAddDrawer = () => {
  editingAgenda.value = null
  isFormDrawerVisible.value = true
}

const openEditDrawer = (agenda: Agenda) => {
  editingAgenda.value = agenda
  isFormDrawerVisible.value = true
}

const handleFormSubmit = async () => {
  isFormDrawerVisible.value = false
  await fetchAgendas()
}

const confirmDelete = (id: number) => {
  deletingId.value = id
  isDeleteDialogVisible.value = true
}

const handleDeleteConfirm = async () => {
  if (deletingId.value === null)
    return
  try {
    await agendaStore.deleteAgenda(props.meetingId, deletingId.value)
    showToast('Xóa mục chương trình thành công!', 'success')
    isDeleteDialogVisible.value = false
    syncItemsFromStore()
  }
  catch {
    showToast('Xóa thất bại!', 'error')
    isDeleteDialogVisible.value = false
  }
}

const confirmSetCurrent = (id: number) => {
  settingCurrentId.value = id
  isSetCurrentDialogVisible.value = true
}

const handleSetCurrentConfirm = async () => {
  if (settingCurrentId.value === null)
    return
  try {
    await agendaStore.setCurrentAgenda(props.meetingId, settingCurrentId.value)
    showToast('Đã đặt mục đang diễn ra!', 'success')
    isSetCurrentDialogVisible.value = false
    syncItemsFromStore()
  }
  catch {
    showToast('Thao tác thất bại!', 'error')
    isSetCurrentDialogVisible.value = false
  }
}

const goBack = () => {
  router.push({ name: 'meetings' })
}

const formatDuration = (minutes: number | null) => {
  if (!minutes)
    return null
  if (minutes < 60)
    return `${minutes} phút`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60

  return m ? `${h}g ${m}p` : `${h} giờ`
}

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchMeeting(), fetchAgendas()])
})

onUnmounted(() => {
  agendaStore.reset()
})
</script>

<template>
  <section>
    <!-- Page Header -->
    <VCard class="mb-6">
      <VCardText class="pa-4">
        <div class="d-flex align-center gap-3">
          <VBtn
            icon
            variant="tonal"
            size="small"
            @click="goBack"
          >
            <VIcon icon="tabler-arrow-left" />
          </VBtn>

          <div class="flex-grow-1">
            <div class="text-overline text-disabled mb-1">
              Quản lý chương trình họp
            </div>
            <h5
              v-if="meeting"
              class="text-h5 font-weight-bold"
            >
              {{ meeting.title }}
            </h5>
            <VSkeleton
              v-else
              type="text"
              width="300"
            />
            <div
              v-if="meeting"
              class="d-flex align-center gap-4 mt-1 flex-wrap"
            >
              <span class="text-body-2 text-disabled d-flex align-center gap-1">
                <VIcon
                  icon="tabler-calendar"
                  size="14"
                />
                {{ meeting.start_at }}
              </span>
              <span
                v-if="meeting.location"
                class="text-body-2 text-disabled d-flex align-center gap-1"
              >
                <VIcon
                  icon="tabler-map-pin"
                  size="14"
                />
                {{ meeting.location }}
              </span>
              <VChip
                v-if="meeting.status"
                size="x-small"
                :color="meeting.status === 'in_progress' ? 'warning' : meeting.status === 'ended' ? 'success' : 'info'"
              >
                {{ meeting.status === 'draft' ? 'Nháp' : meeting.status === 'active' ? 'Đã lên lịch' : meeting.status === 'in_progress' ? 'Đang diễn ra' : 'Đã kết thúc' }}
              </VChip>
            </div>
          </div>

          <VBtn
            prepend-icon="tabler-plus"
            color="primary"
            @click="openAddDrawer"
          >
            Thêm mục
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- Loading state -->
    <template v-if="isLoading && dragItems.length === 0">
      <VCard
        v-for="i in 4"
        :key="i"
        class="mb-3"
      >
        <VCardText class="d-flex align-center gap-4 py-4">
          <VSkeletonLoader
            type="avatar"
            width="10"
            height="40"
          />
          <VSkeletonLoader
            type="avatar"
            width="40"
            height="40"
          />
          <div class="flex-grow-1">
            <VSkeletonLoader
              type="text"
              width="50%"
              class="mb-1"
            />
            <VSkeletonLoader
              type="text"
              width="30%"
            />
          </div>
        </VCardText>
      </VCard>
    </template>

    <!-- Empty state -->
    <VCard
      v-else-if="!isLoading && dragItems.length === 0"
      class="text-center"
    >
      <VCardText class="py-16">
        <VIcon
          icon="tabler-clipboard-list"
          size="64"
          color="disabled"
          class="mb-5"
        />
        <div class="text-h6 mb-2">
          Chưa có mục nào
        </div>
        <VBtn
          prepend-icon="tabler-plus"
          color="primary"
          @click="openAddDrawer"
        >
          Thêm mục đầu tiên
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Drag-and-drop list -->
    <template v-else>
      <div
        ref="dragParent"
        class="agenda-list"
        @dragend="onDragEnd"
      >
        <div
          v-for="(agenda, index) in dragItems"
          :key="agenda.id"
          class="agenda-item-wrapper mb-3"
        >
          <VCard
            class="agenda-card"
            :class="[
              { 'agenda-card--active': agenda.is_current },
            ]"
            :elevation="agenda.is_current ? 4 : 1"
          >
            <!-- Active indicator bar -->
            <div
              class="agenda-status-bar"
              :style="{
                background: agenda.is_current
                  ? 'rgb(var(--v-theme-primary))'
                  : 'rgb(var(--v-theme-surface-variant))',
              }"
            />

            <VCardText class="d-flex align-center gap-3 py-3 ps-3 pe-4">
              <!-- Drag handle -->
              <div
                class="drag-handle d-flex align-center text-disabled"
                style="cursor: grab;"
              >
                <VIcon
                  icon="tabler-grip-vertical"
                  size="20"
                />
              </div>

              <!-- Order badge -->
              <VAvatar
                :color="agenda.is_current ? 'primary' : 'secondary'"
                :variant="agenda.is_current ? 'flat' : 'tonal'"
                size="38"
                rounded="lg"
                class="flex-shrink-0 font-weight-bold"
              >
                <span class="text-body-1 font-weight-bold">{{ index + 1 }}</span>
              </VAvatar>

              <!-- Content -->
              <div class="flex-grow-1 min-width-0">
                <div class="d-flex align-center gap-2 mb-1 flex-wrap">
                  <span
                    class="text-body-1 font-weight-semibold text-high-emphasis"
                    :class="{ 'text-primary': agenda.is_current }"
                  >
                    {{ agenda.title }}
                  </span>
                  <VChip
                    v-if="agenda.is_current"
                    color="primary"
                    size="x-small"
                    label
                    class="font-weight-medium"
                  >
                    <VIcon
                      icon="tabler-player-play-filled"
                      size="10"
                      class="me-1"
                    />
                    Đang diễn ra
                  </VChip>
                </div>
                <div
                  v-if="agenda.description"
                  class="text-body-2 text-medium-emphasis text-truncate"
                >
                  {{ agenda.description }}
                </div>
              </div>

              <!-- Duration -->
              <VChip
                v-if="agenda.duration"
                size="small"
                variant="tonal"
                color="warning"
                label
                class="flex-shrink-0"
              >
                <VIcon
                  icon="tabler-clock"
                  size="14"
                  class="me-1"
                />
                {{ formatDuration(agenda.duration) }}
              </VChip>

              <!-- Actions -->
              <div class="d-flex gap-1 flex-shrink-0">
                <VBtn
                  v-if="!agenda.is_current"
                  icon
                  variant="text"
                  size="small"
                  color="success"
                  @click="confirmSetCurrent(agenda.id)"
                >
                  <VIcon
                    icon="tabler-player-play"
                    size="18"
                  />
                  <VTooltip
                    activator="parent"
                    location="top"
                  >
                    Đặt đang diễn ra
                  </VTooltip>
                </VBtn>
                <VBtn
                  v-else
                  icon
                  variant="text"
                  size="small"
                  color="primary"
                  disabled
                >
                  <VIcon
                    icon="tabler-player-play-filled"
                    size="18"
                  />
                </VBtn>

                <VBtn
                  icon
                  variant="text"
                  size="small"
                  @click="openEditDrawer(agenda)"
                >
                  <VIcon
                    icon="tabler-edit"
                    size="18"
                  />
                  <VTooltip
                    activator="parent"
                    location="top"
                  >
                    Sửa
                  </VTooltip>
                </VBtn>

                <VBtn
                  icon
                  variant="text"
                  size="small"
                  color="error"
                  @click="confirmDelete(agenda.id)"
                >
                  <VIcon
                    icon="tabler-trash"
                    size="18"
                  />
                  <VTooltip
                    activator="parent"
                    location="top"
                  >
                    Xóa
                  </VTooltip>
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </div>
      </div>

      <!-- Drag hint -->
      <div
        v-if="dragItems.length > 1"
        class="d-flex align-center justify-center gap-2 mt-2 text-disabled"
      >
        <VIcon
          icon="tabler-arrows-up-down"
          size="14"
        />
        <span class="text-caption">Kéo thả để sắp xếp thứ tự</span>
      </div>
    </template>

    <!-- Form Drawer -->
    <AgendaFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :meeting-id="props.meetingId"
      :agenda="editingAgenda"
      :total-items="dragItems.length"
      @submit="handleFormSubmit"
    />

    <!-- Delete Confirm Dialog -->
    <VDialog
      v-model="isDeleteDialogVisible"
      max-width="450"
    >
      <VCard>
        <VCardTitle class="text-h6 pa-4">
          Xác nhận xóa
        </VCardTitle>
        <VCardText class="pb-2">
          Bạn có chắc chắn muốn xóa mục chương trình này? Hành động này không thể hoàn tác.
        </VCardText>
        <VCardActions class="pa-4 pt-2">
          <VSpacer />
          <VBtn
            variant="tonal"
            @click="isDeleteDialogVisible = false"
          >
            Hủy
          </VBtn>
          <VBtn
            color="error"
            :loading="isLoading"
            @click="handleDeleteConfirm"
          >
            Xóa
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Set Current Confirm Dialog -->
    <VDialog
      v-model="isSetCurrentDialogVisible"
      max-width="450"
    >
      <VCard>
        <VCardTitle class="text-h6 pa-4">
          Đặt mục đang diễn ra
        </VCardTitle>
        <VCardText class="pb-2">
          Mục này sẽ được đánh dấu là <strong>đang diễn ra</strong>. Mục hiện tại (nếu có) sẽ được bỏ đánh dấu.
        </VCardText>
        <VCardActions class="pa-4 pt-2">
          <VSpacer />
          <VBtn
            variant="tonal"
            @click="isSetCurrentDialogVisible = false"
          >
            Hủy
          </VBtn>
          <VBtn
            color="primary"
            :loading="isLoading"
            @click="handleSetCurrentConfirm"
          >
            Xác nhận
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Toast Snackbar -->
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
  </section>
</template>

<style scoped>
.agenda-card {
  transition: box-shadow 0.2s ease, transform 0.15s ease;
  overflow: hidden;
  position: relative;
}

.agenda-card:hover {
  box-shadow: 0 4px 16px rgba(var(--v-shadow-key-umbra-color), 0.15) !important;
}

.agenda-card--active {
  background: rgba(var(--v-theme-primary), 0.04);
}

.agenda-status-bar {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: 4px;
  border-radius: 4px 0 0 4px;
}

.drag-handle {
  touch-action: none;
  opacity: 0.4;
  transition: opacity 0.15s;
}

.agenda-card:hover .drag-handle {
  opacity: 1;
}

.min-width-0 {
  min-inline-size: 0;
}

/* Library drag classes */
:deep(.agenda-dragging) {
  opacity: 0.5;
  transform: scale(0.98);
  box-shadow: 0 8px 24px rgba(var(--v-shadow-key-umbra-color), 0.25) !important;
}

:deep(.agenda-dropzone) {
  outline: 2px dashed rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>
