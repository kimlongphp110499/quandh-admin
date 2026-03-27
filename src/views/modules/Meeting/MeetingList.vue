<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import MeetingFormDrawer from './MeetingFormDrawer.vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useMeetingStore } from '@/store/modules/meeting'
import type { Meeting } from '@/api/modules/meeting'

definePage({
  meta: {
    action: 'index',
    subject: 'Meeting',
  },
})

// Store
const meetingStore = useMeetingStore()
const router = useRouter()

// State
const searchQuery = ref('')
const selectedStatus = ref()
const fromDate = ref('')
const toDate = ref('')
const isFormDrawerVisible = ref(false)
const editingMeeting = ref<Meeting | null>(null)
const selected = ref<Meeting[]>([])

// Bulk status dialog
const isBulkStatusDialogVisible = ref(false)
const bulkStatusValue = ref<Meeting['status']>('active')

// Delete confirm dialog (single & bulk)
const isDeleteDialogVisible = ref(false)
const deletingId = ref<number | null>(null) // null = bulk delete

// Import
const importFileInput = ref<HTMLInputElement>()
const isImporting = ref(false)
const isExporting = ref(false)

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

// Data table options
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref([{ key: 'created_at', order: 'desc' }])

// Headers
const headers = [
  { title: '', key: 'data-table-select', sortable: false },
  { title: 'Tiêu đề', key: 'title', sortable: true },
  { title: 'Bắt đầu', key: 'start_at', sortable: true },
  { title: 'Kết thúc', key: 'end_at', sortable: true },
  { title: 'Địa điểm', key: 'location' },
  { title: 'Trạng thái', key: 'status', sortable: true },
  { title: 'Thao tác', key: 'actions', sortable: false },
]

// Computed
const meetings = computed(() => meetingStore.meetings)
const totalMeetings = computed(() => meetingStore.totalMeetings)
const isLoading = computed(() => meetingStore.isLoading)
const selectedIds = computed(() => selected.value.map(m => m.id))

// Filters
const statusOptions = [
  { title: 'Tất cả', value: '' },
  { title: 'Nháp', value: 'draft' },
  { title: 'Đã lên lịch', value: 'active' },
  { title: 'Đang diễn ra', value: 'in_progress' },
  { title: 'Đã kết thúc', value: 'ended' },
]

const bulkStatusOptions = [
  { title: 'Nháp', value: 'draft' },
  { title: 'Đã lên lịch', value: 'active' },
  { title: 'Đang diễn ra', value: 'in_progress' },
  { title: 'Đã kết thúc', value: 'ended' },
]

// Methods
const fetchMeetings = async () => {
  await meetingStore.fetchMeetings({
    page: page.value,
    limit: itemsPerPage.value,
    search: searchQuery.value || undefined,
    status: selectedStatus.value || undefined,
    from_date: fromDate.value ? dayjs(fromDate.value).format('YYYY-MM-DD') : undefined,
    to_date: toDate.value ? dayjs(toDate.value).format('YYYY-MM-DD') : undefined,
    sort_by: sortBy.value[0]?.key || 'created_at',
    sort_order: sortBy.value[0]?.order || 'desc',
  })
}

const resetDateFilter = () => {
  fromDate.value = ''
  toDate.value = ''
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

const openAddDrawer = () => {
  editingMeeting.value = null
  isFormDrawerVisible.value = true
}

const openEditDrawer = (meeting: Meeting) => {
  editingMeeting.value = meeting
  isFormDrawerVisible.value = true
}

const openAgendaEditor = (id: number) => {
  router.push({ name: 'meetings-id-agenda', params: { id } })
}

const openParticipantManager = (id: number) => {
  router.push({ name: 'meetings-id-participants', params: { id } })
}

const openAttendance = (id: number) => {
  router.push({ name: 'meetings-id-attendance', params: { id } })
}

const openCheckinKiosk = (id: number) => {
  router.push({ name: 'meetings-id-checkin', params: { id } })
}

const handleFormSubmit = async () => {
  isFormDrawerVisible.value = false
  await fetchMeetings()
}

const confirmDeleteSingle = (id: number) => {
  deletingId.value = id
  isDeleteDialogVisible.value = true
}

const confirmBulkDelete = () => {
  if (selectedIds.value.length === 0)
    return
  deletingId.value = null
  isDeleteDialogVisible.value = true
}

const handleDeleteConfirm = async () => {
  try {
    if (deletingId.value !== null) {
      await meetingStore.deleteMeeting(deletingId.value)
      showToast('Xóa cuộc họp thành công!', 'success')
    }
    else {
      await meetingStore.bulkDelete(selectedIds.value)
      showToast(`Đã xóa ${selectedIds.value.length} cuộc họp!`, 'success')
      selected.value = []
    }
    isDeleteDialogVisible.value = false
    await fetchMeetings()
  }
  catch {
    showToast('Xóa thất bại!', 'error')
    isDeleteDialogVisible.value = false
  }
}

const openBulkStatusDialog = () => {
  if (selectedIds.value.length === 0)
    return
  bulkStatusValue.value = 'active'
  isBulkStatusDialogVisible.value = true
}

const handleBulkUpdateStatus = async () => {
  try {
    await meetingStore.bulkUpdateStatus(selectedIds.value, bulkStatusValue.value)
    showToast(`Đã cập nhật trạng thái ${selectedIds.value.length} cuộc họp!`, 'success')
    selected.value = []
    isBulkStatusDialogVisible.value = false
    await fetchMeetings()
  }
  catch {
    showToast('Cập nhật trạng thái thất bại!', 'error')
    isBulkStatusDialogVisible.value = false
  }
}

const handleExport = async () => {
  isExporting.value = true
  try {
    await meetingStore.exportMeetings({
      search: searchQuery.value || undefined,
      status: selectedStatus.value || undefined,
    })
    showToast('Xuất file thành công!', 'success')
  }
  catch {
    showToast('Xuất file thất bại!', 'error')
  }
  finally {
    isExporting.value = false
  }
}

const triggerImport = () => {
  importFileInput.value?.click()
}

const handleImportFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  isImporting.value = true
  try {
    await meetingStore.importMeetings(file)
    showToast('Nhập dữ liệu thành công!', 'success')
    await fetchMeetings()
  }
  catch (err: any) {
    showToast(err?.response?.data?.message || 'Nhập dữ liệu thất bại!', 'error')
  }
  finally {
    isImporting.value = false

    // Reset input để có thể import lại cùng file
    if (importFileInput.value)
      importFileInput.value.value = ''
  }
}

const updateOptions = (options: any) => {
  page.value = options.page
  itemsPerPage.value = options.itemsPerPage
  sortBy.value = options.sortBy
}

// Watchers
watch([searchQuery, selectedStatus, fromDate, toDate], () => {
  page.value = 1
  fetchMeetings()
})

watch([page, itemsPerPage, sortBy], () => {
  fetchMeetings()
}, { deep: true })

// Load initial data
fetchMeetings()
</script>

<template>
  <section>
    <!-- Stats Cards -->
    <VRow class="mb-6">
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar
              color="primary"
              variant="tonal"
              rounded
              size="44"
              class="me-4"
            >
              <VIcon
                icon="tabler-calendar"
                size="26"
              />
            </VAvatar>
            <div>
              <div class="text-body-1 font-weight-medium">
                Tổng cuộc họp
              </div>
              <h4 class="text-h4">
                {{ totalMeetings }}
              </h4>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar
              color="info"
              variant="tonal"
              rounded
              size="44"
              class="me-4"
            >
              <VIcon
                icon="tabler-clock"
                size="26"
              />
            </VAvatar>
            <div>
              <div class="text-body-1 font-weight-medium">
                Đã lên lịch
              </div>
              <h4 class="text-h4">
                {{ meetings.filter(m => m.status === 'active').length }}
              </h4>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar
              color="success"
              variant="tonal"
              rounded
              size="44"
              class="me-4"
            >
              <VIcon
                icon="tabler-check"
                size="26"
              />
            </VAvatar>
            <div>
              <div class="text-body-1 font-weight-medium">
                Đã hoàn thành
              </div>
              <h4 class="text-h4">
                {{ meetings.filter(m => m.status === 'ended').length }}
              </h4>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar
              color="warning"
              variant="tonal"
              rounded
              size="44"
              class="me-4"
            >
              <VIcon
                icon="tabler-progress"
                size="26"
              />
            </VAvatar>
            <div>
              <div class="text-body-1 font-weight-medium">
                Đang diễn ra
              </div>
              <h4 class="text-h4">
                {{ meetings.filter(m => m.status === 'in_progress').length }}
              </h4>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Table Card -->
    <VCard>
      <VCardText class="d-flex flex-wrap gap-4">
        <!-- Items per page -->
        <div class="d-flex gap-2 align-center">
          <span class="text-body-1">Hiển thị</span>
          <AppSelect
            :model-value="itemsPerPage"
            :items="[
              { value: 10, title: '10' },
              { value: 25, title: '25' },
              { value: 50, title: '50' },
              { value: 100, title: '100' },
              { value: -1, title: 'Tất cả' },
            ]"
            style="inline-size: 5.5rem;"
            @update:model-value="itemsPerPage = parseInt($event, 10)"
          />
        </div>

        <VSpacer />

        <!-- Filters & Actions -->
        <div class="d-flex align-center flex-wrap gap-4">
          <!-- Bulk actions (shown when items selected) -->
          <template v-if="selected.length > 0">
            <span class="text-body-2 text-disabled">
              Đã chọn {{ selected.length }} mục
            </span>
            <VBtn
              color="error"
              variant="tonal"
              size="small"
              prepend-icon="tabler-trash"
              @click="confirmBulkDelete"
            >
              Xóa ({{ selected.length }})
            </VBtn>
            <VBtn
              color="warning"
              variant="tonal"
              size="small"
              prepend-icon="tabler-refresh"
              @click="openBulkStatusDialog"
            >
              Cập nhật trạng thái
            </VBtn>
          </template>

          <!-- Date Range Filter -->
          <AppDateTimePicker
            v-model="fromDate"
            placeholder="Từ ngày"
            :config="{
              dateFormat: 'Y-m-d',
              maxDate: toDate || undefined,
            }"
            style="inline-size: 10rem;"
            clearable
          />
          <span class="text-body-2 text-disabled">–</span>
          <AppDateTimePicker
            v-model="toDate"
            placeholder="Đến ngày"
            :config="{
              dateFormat: 'Y-m-d',
              minDate: fromDate || undefined,
            }"
            style="inline-size: 10rem;"
            clearable
          />
          <VBtn
            v-if="fromDate || toDate"
            icon="tabler-x"
            size="small"
            variant="text"
            color="secondary"
            @click="resetDateFilter"
          />

          <!-- Status Filter -->
          <AppSelect
            v-model="selectedStatus"
            placeholder="Trạng thái"
            :items="statusOptions"
            clearable
            style="inline-size: 12rem;"
          />

          <!-- Search -->
          <AppTextField
            v-model="searchQuery"
            placeholder="Tìm kiếm cuộc họp..."
            style="inline-size: 15.625rem;"
          />

          <!-- Export Button -->
          <VBtn
            color="secondary"
            variant="tonal"
            prepend-icon="tabler-download"
            :loading="isExporting"
            @click="handleExport"
          >
            Xuất
          </VBtn>

          <!-- Import Button -->
          <VBtn
            color="secondary"
            variant="tonal"
            prepend-icon="tabler-upload"
            :loading="isImporting"
            @click="triggerImport"
          >
            Nhập
          </VBtn>
          <input
            ref="importFileInput"
            type="file"
            accept=".xlsx,.xls,.csv"
            class="d-none"
            @change="handleImportFile"
          >

          <!-- Add Button -->
          <VBtn
            prepend-icon="tabler-plus"
            @click="openAddDrawer"
          >
            Thêm cuộc họp
          </VBtn>
        </div>
      </VCardText>

      <VDivider />

      <!-- Data Table -->
      <VDataTableServer
        v-model="selected"
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :headers="headers"
        :items="meetings"
        :items-length="totalMeetings"
        :loading="isLoading"
        item-value="id"
        show-select
        return-object
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <!-- Title -->
        <template #item.title="{ item }">
          <div class="d-flex flex-column">
            <span class="font-weight-medium text-high-emphasis">
              {{ item.title }}
            </span>
            <small
              v-if="item.description"
              class="text-disabled"
            >
              {{ item.description?.substring(0, 50) }}{{ item.description?.length > 50 ? '...' : '' }}
            </small>
          </div>
        </template>

        <!-- Meeting Date -->
        <template #item.start_at="{ item }">
          <span>{{ item.start_at }}</span>
        </template>

        <!-- End Date -->
        <template #item.end_at="{ item }">
          <span>{{ item.end_at }}</span>
        </template>

        <!-- Location -->
        <template #item.location="{ item }">
          <div class="d-flex align-center gap-1">
            <VIcon
              icon="tabler-map-pin"
              size="18"
            />
            <span class="text-body-2">{{ item.location || 'Chưa xác định' }}</span>
          </div>
        </template>

        <!-- Status -->
        <template #item.status="{ item }">
          <VChip
            :color="resolveStatusVariant(item.status)"
            size="small"
          >
            {{ resolveStatusLabel(item.status) }}
          </VChip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn
              size="small"
              color="primary"
              @click="openAgendaEditor(item.id)"
            >
              <VIcon icon="tabler-list-details" />
              <VTooltip
                activator="parent"
                location="top"
              >
                Chương trình
              </VTooltip>
            </IconBtn>

            <IconBtn
              size="small"
              color="primary"
              @click="openParticipantManager(item.id)"
            >
              <VIcon icon="tabler-users" />
              <VTooltip
                activator="parent"
                location="top"
              >
                Đại biểu
              </VTooltip>
            </IconBtn>

            <IconBtn
              size="small"
              color="primary"
              @click="openAttendance(item.id)"
            >
              <VIcon icon="tabler-clipboard-check" />
              <VTooltip
                activator="parent"
                location="top"
              >
                Theo dõi điểm danh
              </VTooltip>
            </IconBtn>

            <IconBtn
              size="small"
              color="primary"
              @click="openCheckinKiosk(item.id)"
            >
              <VIcon icon="tabler-login" />
              <VTooltip
                activator="parent"
                location="top"
              >
                Kiosk điểm danh
              </VTooltip>
            </IconBtn>

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
              @click="confirmDeleteSingle(item.id)"
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

        <!-- No Data -->
        <template #no-data>
          <div class="text-center py-10">
            <VIcon
              icon="tabler-calendar-off"
              size="48"
              color="disabled"
              class="mb-4"
            />
            <div class="text-body-1 text-disabled">
              Không có cuộc họp nào
            </div>
          </div>
        </template>
      </VDataTableServer>
    </VCard>

    <!-- Form Drawer -->
    <MeetingFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :meeting="editingMeeting"
      @submit="handleFormSubmit"
    />

    <!-- Delete Confirm Dialog (single & bulk) -->
    <VDialog
      v-model="isDeleteDialogVisible"
      max-width="450"
    >
      <VCard>
        <VCardTitle class="text-h6 pa-4">
          Xác nhận xóa
        </VCardTitle>
        <VCardText>
          <template v-if="deletingId !== null">
            Bạn có chắc chắn muốn xóa cuộc họp này? Hành động này không thể hoàn tác.
          </template>
          <template v-else>
            Bạn có chắc chắn muốn xóa <strong>{{ selected.length }} cuộc họp</strong> đã chọn? Hành động này không thể hoàn tác.
          </template>
        </VCardText>
        <VCardActions class="pa-4 pt-0">
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

    <!-- Bulk Status Dialog -->
    <VDialog
      v-model="isBulkStatusDialogVisible"
      max-width="450"
    >
      <VCard>
        <VCardTitle class="text-h6 pa-4">
          Cập nhật trạng thái hàng loạt
        </VCardTitle>
        <VCardText>
          <p class="mb-4">
            Cập nhật trạng thái cho <strong>{{ selected.length }} cuộc họp</strong> đã chọn:
          </p>
          <AppSelect
            v-model="bulkStatusValue"
            label="Trạng thái mới"
            :items="bulkStatusOptions"
          />
        </VCardText>
        <VCardActions class="pa-4 pt-0">
          <VSpacer />
          <VBtn
            variant="tonal"
            @click="isBulkStatusDialogVisible = false"
          >
            Hủy
          </VBtn>
          <VBtn
            color="primary"
            :loading="isLoading"
            @click="handleBulkUpdateStatus"
          >
            Cập nhật
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
