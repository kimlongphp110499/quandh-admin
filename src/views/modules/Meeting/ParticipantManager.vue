<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ParticipantFormDrawer from './ParticipantFormDrawer.vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { MEETING_ROLE_OPTIONS, type Participant } from '@/api/modules/participant'
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

// Meeting info
const meeting = ref<Meeting | null>(null)
const isMeetingLoading = ref(false)

// Drawer
const isFormDrawerVisible = ref(false)
const editingParticipant = ref<Participant | null>(null)

// Delete dialog
const isDeleteDialogVisible = ref(false)
const deletingId = ref<number | null>(null)
const isBulkDeleteDialogVisible = ref(false)

// Selection
const selected = ref<Participant[]>([])
const selectedIds = computed(() => selected.value.map(p => p.id))

// Search / filter
const searchQuery = ref('')
const selectedRole = ref('')

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

// Table
const headers = [
  { title: '', key: 'data-table-select', sortable: false },
  { title: 'Họ và tên', key: 'user_name', sortable: true },
  { title: 'Email', key: 'user_email', sortable: false },
  { title: 'Chức vụ', key: 'position', sortable: false },
  { title: 'Vai trò', key: 'meeting_role', sortable: true },
  { title: 'Điểm danh', key: 'attendance_status', sortable: true },
  { title: 'Thao tác', key: 'actions', sortable: false },
]

// Computed
const isLoading = computed(() => participantStore.isLoading)

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

  if (selectedRole.value)
    list = list.filter(p => p.meeting_role === selectedRole.value)

  return list
})

const totalByRole = computed(() => {
  const all = participantStore.participants

  return {
    total: all.length,
    chair: all.filter(p => p.meeting_role === 'chair').length,
    secretary: all.filter(p => p.meeting_role === 'secretary').length,
    delegate: all.filter(p => p.meeting_role === 'delegate').length,
  }
})

const totalByStatus = computed(() => {
  const all = participantStore.participants

  return {
    present: all.filter(p => p.attendance_status === 'present').length,
    absent: all.filter(p => p.attendance_status === 'absent').length,
    not_arrived: all.filter(p => p.attendance_status === 'not_arrived').length,
  }
})

// Role helpers
const roleFilterOptions = [
  { title: 'Tất cả vai trò', value: '' },
  ...MEETING_ROLE_OPTIONS,
]

const resolveRoleLabel = (role: string) => {
  return MEETING_ROLE_OPTIONS.find(r => r.value === role)?.title ?? role
}

const resolveRoleColor = (role: string) => {
  const map: Record<string, string> = {
    chair: 'error',
    secretary: 'warning',
    delegate: 'primary',
  }

  return map[role] ?? 'default'
}

const resolveStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    present: 'Có mặt',
    absent: 'Vắng mặt',
    not_arrived: 'Chưa đến',
  }

  return map[status] ?? status
}

const resolveStatusColor = (status: string) => {
  const map: Record<string, string> = {
    present: 'success',
    absent: 'error',
    not_arrived: 'default',
  }

  return map[status] ?? 'default'
}

// Methods
const fetchMeeting = async () => {
  isMeetingLoading.value = true
  try {
    const res = await meetingApi.show(props.meetingId)
    if (res.data.success)
      meeting.value = res.data.data ?? null
  }
  finally {
    isMeetingLoading.value = false
  }
}

const fetchParticipants = async () => {
  try {
    await participantStore.fetchParticipants(props.meetingId)
  }
  catch {
    showToast('Không thể tải danh sách đại biểu.', 'error')
  }
}

const openAddDrawer = () => {
  editingParticipant.value = null
  isFormDrawerVisible.value = true
}

const openEditDrawer = (participant: Participant) => {
  editingParticipant.value = participant
  isFormDrawerVisible.value = true
}

const confirmDelete = (id: number) => {
  deletingId.value = id
  isDeleteDialogVisible.value = true
}

const onDeleteConfirmed = async () => {
  if (!deletingId.value)
    return

  isDeleteDialogVisible.value = false
  try {
    await participantStore.deleteParticipant(props.meetingId, deletingId.value)
    showToast('Đã xóa đại biểu thành công.', 'success')
  }
  catch {
    showToast('Xóa đại biểu thất bại.', 'error')
  }
  finally {
    deletingId.value = null
  }
}

const onBulkDeleteConfirmed = async () => {
  isBulkDeleteDialogVisible.value = false
  try {
    await participantStore.bulkDeleteParticipants(props.meetingId, selectedIds.value)
    showToast(`Đã xóa ${selectedIds.value.length} đại biểu.`, 'success')
    selected.value = []
  }
  catch {
    showToast('Xóa hàng loạt thất bại.', 'error')
  }
}

const onFormSubmit = async () => {
  // Store already updated internally; just refresh to sync
  await fetchParticipants()
}

const goBack = () => {
  router.push({ name: 'meetings' })
}

// Watchers
watch(searchQuery, () => {
  selected.value = []
})

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchMeeting(), fetchParticipants()])
})
</script>

<template>
  <div>
    <!-- Header Card -->
    <VCard class="mb-6">
      <VCardText class="pa-5">
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
                icon="tabler-users"
                color="primary"
                size="22"
              />
              <h5 class="text-h5 font-weight-bold">
                Quản lý Đại biểu
              </h5>
            </div>
            <div
              v-if="meeting"
              class="text-body-2 text-medium-emphasis"
            >
              {{ meeting.title }}
            </div>
          </div>

          <!-- Stats Chips -->
          <div class="d-flex gap-2 flex-wrap">
            <VChip
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="tabler-users"
            >
              {{ totalByRole.total }} đại biểu
            </VChip>
            <VChip
              color="error"
              variant="tonal"
              size="small"
            >
              {{ totalByRole.chair }} chủ trì
            </VChip>
            <VChip
              color="warning"
              variant="tonal"
              size="small"
            >
              {{ totalByRole.secretary }} thư ký
            </VChip>
            <VChip
              color="success"
              variant="tonal"
              size="small"
              prepend-icon="tabler-circle-check"
            >
              {{ totalByStatus.present }} có mặt
            </VChip>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Toolbar -->
    <VCard class="mb-4">
      <VCardText class="pa-4">
        <div class="d-flex align-center gap-3 flex-wrap">
          <!-- Search -->
          <AppTextField
            v-model="searchQuery"
            placeholder="Tìm tên, email, chức vụ..."
            prepend-inner-icon="tabler-search"
            style="min-width: 240px; max-width: 360px;"
            clearable
            density="compact"
          />

          <!-- Role filter -->
          <AppSelect
            v-model="selectedRole"
            :items="roleFilterOptions"
            item-title="title"
            item-value="value"
            style="min-width: 180px;"
            density="compact"
          />

          <VSpacer />

          <!-- Bulk delete -->
          <VBtn
            v-if="selected.length"
            color="error"
            variant="tonal"
            prepend-icon="tabler-trash"
            @click="isBulkDeleteDialogVisible = true"
          >
            Xóa {{ selected.length }} mục
          </VBtn>

          <!-- Add button -->
          <VBtn
            color="primary"
            prepend-icon="tabler-plus"
            @click="openAddDrawer"
          >
            Thêm đại biểu
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- Data Table -->
    <VCard>
      <VDataTable
        v-model="selected"
        :headers="headers"
        :items="filteredParticipants"
        :loading="isLoading"
        show-select
        item-value="id"
        hover
      >
        <!-- Name -->
        <template #item.user_name="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <VAvatar
              color="primary"
              size="36"
              variant="tonal"
            >
              <span class="text-body-2 font-weight-bold">
                {{ item.user_name?.charAt(0)?.toUpperCase() ?? '?' }}
              </span>
            </VAvatar>
            <div>
              <div class="font-weight-medium text-body-1">
                {{ item.user_name ?? 'Không rõ' }}
              </div>
              <div class="text-caption text-medium-emphasis d-md-none">
                {{ item.user_email }}
              </div>
            </div>
          </div>
        </template>

        <!-- Email -->
        <template #item.user_email="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.user_email }}</span>
        </template>

        <!-- Position -->
        <template #item.position="{ item }">
          <span class="text-body-2">{{ item.position }}</span>
        </template>

        <!-- Role -->
        <template #item.meeting_role="{ item }">
          <VChip
            :color="resolveRoleColor(item.meeting_role)"
            size="small"
            variant="tonal"
          >
            {{ resolveRoleLabel(item.meeting_role) }}
          </VChip>
        </template>

        <!-- Attendance status -->
        <template #item.attendance_status="{ item }">
          <VChip
            :color="resolveStatusColor(item.attendance_status)"
            size="small"
            variant="tonal"
          >
            {{ resolveStatusLabel(item.attendance_status) }}
          </VChip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn
              size="small"
              @click="openEditDrawer(item)"
            >
              <VIcon icon="tabler-edit" />
              <VTooltip
                activator="parent"
                location="top"
              >
                Sửa
              </VTooltip>
            </IconBtn>

            <IconBtn
              size="small"
              color="error"
              @click="confirmDelete(item.id)"
            >
              <VIcon icon="tabler-trash" />
              <VTooltip
                activator="parent"
                location="top"
              >
                Xóa
              </VTooltip>
            </IconBtn>
          </div>
        </template>

        <!-- Loading -->
        <template #loading>
          <VProgressLinear
            indeterminate
            color="primary"
          />
        </template>

        <!-- Empty state -->
        <template #no-data>
          <div class="d-flex flex-column align-center py-10 text-medium-emphasis">
            <VIcon
              icon="tabler-users-minus"
              size="48"
              class="mb-3"
              opacity="0.4"
            />
            <p class="mb-0">
              {{ searchQuery || selectedRole ? 'Không tìm thấy đại biểu phù hợp' : 'Chưa có đại biểu nào' }}
            </p>
            <VBtn
              v-if="!searchQuery && !selectedRole"
              class="mt-4"
              color="primary"
              variant="tonal"
              prepend-icon="tabler-plus"
              @click="openAddDrawer"
            >
              Thêm đại biểu đầu tiên
            </VBtn>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- Form Drawer -->
    <ParticipantFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :meeting-id="props.meetingId"
      :participant="editingParticipant"
      @submit="onFormSubmit"
    />

    <!-- Delete confirm dialog -->
    <VDialog
      v-model="isDeleteDialogVisible"
      max-width="420"
    >
      <VCard>
        <VCardTitle class="text-h6 pa-5">
          Xác nhận xóa đại biểu
        </VCardTitle>
        <VCardText class="px-5 pb-4">
          Bạn có chắc chắn muốn xóa đại biểu này khỏi cuộc họp? Thao tác này không thể hoàn tác.
        </VCardText>
        <VCardActions class="pa-5 pt-0 gap-2 justify-end">
          <VBtn
            variant="tonal"
            color="secondary"
            @click="isDeleteDialogVisible = false"
          >
            Hủy
          </VBtn>
          <VBtn
            color="error"
            @click="onDeleteConfirmed"
          >
            Xóa
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Bulk delete confirm dialog -->
    <VDialog
      v-model="isBulkDeleteDialogVisible"
      max-width="420"
    >
      <VCard>
        <VCardTitle class="text-h6 pa-5">
          Xác nhận xóa hàng loạt
        </VCardTitle>
        <VCardText class="px-5 pb-4">
          Bạn có chắc chắn muốn xóa {{ selected.length }} đại biểu đã chọn? Thao tác này không thể hoàn tác.
        </VCardText>
        <VCardActions class="pa-5 pt-0 gap-2 justify-end">
          <VBtn
            variant="tonal"
            color="secondary"
            @click="isBulkDeleteDialogVisible = false"
          >
            Hủy
          </VBtn>
          <VBtn
            color="error"
            @click="onBulkDeleteConfirmed"
          >
            Xóa {{ selected.length }} mục
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
  </div>
</template>
