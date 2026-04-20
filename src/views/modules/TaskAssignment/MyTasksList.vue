<!-- eslint-disable import/no-unresolved -->
<!-- eslint-disable import/extensions -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSystemPageHeader from '@/components/AppSystemPageHeader.vue'
import { useMyTaskAssignmentItemStore } from '@/store/modules/my-task-assignment-item'
import type {
  MyTaskItem,
  MyTaskReport,
  MyTaskStatus,
} from '@/api/modules/my-task-assignment-item'
import { taskAssignmentDepartmentApi } from '@/api/modules/task-assignment-department'
import { normalizeDate } from '@/utils/formatters'
import { getErrorMessage } from '@/utils/errorMessage'

const store = useMyTaskAssignmentItemStore()

// ── Filters ───────────────────────────────────────────────────────
const searchQuery = ref('')
const statusFilter = ref<MyTaskStatus | null>(null)
const priorityFilter = ref<string | null>(null)
const departmentFilter = ref<number | null>(null)
const startDateRange = ref('')
const endDateRange = ref('')

const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const hasActiveFilters = computed(() =>
  !!searchQuery.value
  || !!statusFilter.value
  || !!priorityFilter.value
  || !!departmentFilter.value
  || !!startDateRange.value
  || !!endDateRange.value,
)

// ── Option lists ──────────────────────────────────────────────────
const departmentOptions = ref<{ title: string; value: number }[]>([])

const loadFilterOptions = async () => {
  try {
    const deptRes = await taskAssignmentDepartmentApi.list({ limit: 100, status: 'active' })

    if (deptRes.data.success)
      departmentOptions.value = (deptRes.data.data || []).map((d: any) => ({ title: d.name, value: d.id }))
  }
  catch { /* silent */ }
}

// ── Table ─────────────────────────────────────────────────────────
const indexOffset = computed(() => ((store.filters.page ?? 1) - 1) * (store.filters.limit ?? 15))

const headers = [
  { title: 'STT', key: 'index', sortable: false, align: 'center' as const, width: '60px', minWidth: '60px' },
  { title: 'Công việc', key: 'name', sortable: true, align: 'start' as const, minWidth: '240px' },
  { title: 'Văn bản giao việc', key: 'document', sortable: true, align: 'start' as const, minWidth: '180px' },
  { title: 'Vai trò của tôi', key: 'my_assignment', sortable: false, align: 'center' as const, width: '140px', minWidth: '140px' },
  { title: 'Trạng thái', key: 'processing_status', sortable: true, align: 'start' as const, width: '150px', minWidth: '150px' },
  { title: 'Ưu tiên', key: 'priority', sortable: true, align: 'start' as const, width: '110px', minWidth: '110px' },
  { title: 'Thời hạn', key: 'dates', sortable: false, align: 'start' as const, width: '160px', minWidth: '160px' },
  { title: '% Hoàn thành', key: 'completion_percent', sortable: true, align: 'center' as const, width: '110px', minWidth: '110px' },
  { title: 'Hành động', key: 'actions', sortable: false, align: 'center' as const, width: '100px', minWidth: '100px' },
]

const statusOptions = [
  { title: 'Chưa bắt đầu', value: 'todo' },
  { title: 'Đang thực hiện', value: 'in_progress' },
  { title: 'Hoàn thành', value: 'done' },
  { title: 'Quá hạn', value: 'overdue' },
  { title: 'Tạm dừng', value: 'paused' },
  { title: 'Đã hủy', value: 'cancelled' },
]

// Status cho dropdown cập nhật tiến độ (user không được tự set overdue)
const progressStatusOptions = [
  { title: 'Chưa bắt đầu', value: 'todo' },
  { title: 'Đang thực hiện', value: 'in_progress' },
  { title: 'Hoàn thành', value: 'done' },
  { title: 'Tạm dừng', value: 'paused' },
  { title: 'Đã hủy', value: 'cancelled' },
]

const priorityOptions = [
  { title: 'Thấp', value: 'low' },
  { title: 'Bình thường', value: 'medium' },
  { title: 'Cao', value: 'high' },
  { title: 'Khẩn cấp', value: 'urgent' },
]

const resolveStatusColor = (status: string) => {
  const map: Record<string, string> = {
    todo: 'default',
    in_progress: 'info',
    done: 'success',
    overdue: 'error',
    paused: 'warning',
    cancelled: 'secondary',
  }

  return map[status] || 'default'
}

const resolveStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    todo: 'Chưa bắt đầu',
    in_progress: 'Đang thực hiện',
    done: 'Hoàn thành',
    overdue: 'Quá hạn',
    paused: 'Tạm dừng',
    cancelled: 'Đã hủy',
  }

  return map[status] || status
}

const resolvePriorityColor = (priority: string) => {
  const map: Record<string, string> = {
    low: 'default',
    medium: 'info',
    high: 'warning',
    urgent: 'error',
  }

  return map[priority] || 'default'
}

const resolvePriorityLabel = (priority: string) => {
  const map: Record<string, string> = {
    low: 'Thấp',
    medium: 'Bình thường',
    high: 'Cao',
    urgent: 'Khẩn cấp',
  }

  return map[priority] || priority
}

const resolveAssignmentRoleLabel = (role: string) => {
  return role === 'main' ? 'Chủ trì' : 'Phối hợp'
}

const resolveAssignmentRoleColor = (role: string) => {
  return role === 'main' ? 'primary' : 'secondary'
}

const resolveDeadlineAlertColor = (color?: string | null): string => {
  if (color === 'red')
    return 'error'
  if (color === 'yellow')
    return 'warning'
  if (color === 'green')
    return 'success'

  return 'default'
}

const parseDateRange = (range: string) => {
  const parts = range?.split(' to ')

  return {
    from: normalizeDate(parts?.[0]?.trim()),
    to: normalizeDate(parts?.[1]?.trim()),
  }
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr)
    return null
  const normalized = dateStr.replace(' ', 'T')
  const d = new Date(normalized)

  if (Number.isNaN(d.getTime()))
    return dateStr

  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr)
    return '—'
  const normalized = dateStr.replace(' ', 'T')
  const d = new Date(normalized)

  if (Number.isNaN(d.getTime()))
    return dateStr

  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const getMainUsers = (item: MyTaskItem) =>
  (item.users || []).filter(u => u.assignment_role === 'main')

const getSupportUsers = (item: MyTaskItem) =>
  (item.users || []).filter(u => u.assignment_role === 'support')

// ── Load ──────────────────────────────────────────────────────────
const loadItems = async () => {
  const startRange = parseDateRange(startDateRange.value)
  const endRange = parseDateRange(endDateRange.value)

  await store.fetchItems({
    page: store.filters.page,
    limit: store.filters.limit,
    search: searchQuery.value || undefined,
    processing_status: (statusFilter.value as MyTaskStatus) || undefined,
    priority: priorityFilter.value as any || undefined,
    department_id: departmentFilter.value || undefined,
    start_from: startRange.from,
    start_to: startRange.to,
    end_from: endRange.from,
    end_to: endRange.to,
    sort_by: store.filters.sort_by,
    sort_order: store.filters.sort_order,
  })
}

const loadStats = () => {
  store.fetchStats({
    processing_status: statusFilter.value as MyTaskStatus || undefined,
    department_id: departmentFilter.value || undefined,
  })
}

const handleTableUpdate = (options: any) => {
  const sortBy = options.sortBy?.[0]
  const newSortBy = sortBy?.key as any || 'end_at'
  const newSortOrder = sortBy?.order || 'asc'

  if (newSortBy !== store.filters.sort_by || newSortOrder !== store.filters.sort_order) {
    store.setFilters({ sort_by: newSortBy, sort_order: newSortOrder })
    loadItems()
  }
}

let searchTimeout: ReturnType<typeof setTimeout>

watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    store.setFilters({ page: 1 })
    loadItems()
  }, 400)
})

watch([statusFilter, priorityFilter, departmentFilter, startDateRange, endDateRange], () => {
  store.setFilters({ page: 1 })
  loadItems()
  loadStats()
})

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = null
  priorityFilter.value = null
  departmentFilter.value = null
  startDateRange.value = ''
  endDateRange.value = ''
  store.setFilters({ page: 1 })
  loadItems()
  loadStats()
}

// ── Progress Dialog ───────────────────────────────────────────────
const progressDialog = ref(false)
const progressItem = ref<MyTaskItem | null>(null)
const progressStatus = ref<MyTaskStatus | ''>('')
const progressPercent = ref(0)
const progressNote = ref('')
const progressLoading = ref(false)

const openProgressDialog = (item: MyTaskItem) => {
  progressItem.value = item
  progressStatus.value = item.processing_status
  progressPercent.value = item.completion_percent
  // Prefill ghi chú tiến độ hiện tại của user này
  progressNote.value = item.my_assignment?.note || ''
  progressDialog.value = true
}

// Mirror business rules ở FE để UX mượt
watch(progressStatus, val => {
  if (val === 'done')
    progressPercent.value = 100
})

watch(progressPercent, val => {
  if (val === 100 && progressStatus.value !== 'done')
    progressStatus.value = 'done'
})

const submitProgress = async () => {
  if (!progressItem.value)
    return
  progressLoading.value = true
  try {
    await store.updateProgress(progressItem.value.id, {
      processing_status: progressStatus.value as Exclude<MyTaskStatus, 'overdue'> || undefined,
      completion_percent: progressPercent.value,
      note: progressNote.value || undefined,
    })
    showToast('Cập nhật tiến độ thành công!', 'success')
    progressDialog.value = false
    loadStats()
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Cập nhật tiến độ thất bại!'), 'error')
  }
  finally {
    progressLoading.value = false
  }
}

// ── Report Dialog ─────────────────────────────────────────────────
const reportDialog = ref(false)
const reportItem = ref<MyTaskItem | null>(null)
const reportList = ref<MyTaskReport[]>([])
const reportLoading = ref(false)
const reportSubmitting = ref(false)
const editingReport = ref<MyTaskReport | null>(null)
const reportTab = ref('form')

const reportForm = ref({
  completed_at: '',
  report_document_number: '',
  report_document_excerpt: '',
  report_document_content: '',
  files: [] as File[],
  removeAttachmentIds: [] as number[],
})

const reportFileInput = ref<HTMLInputElement>()

const resetReportForm = () => {
  reportForm.value = {
    completed_at: '',
    report_document_number: '',
    report_document_excerpt: '',
    report_document_content: '',
    files: [],
    removeAttachmentIds: [],
  }
  editingReport.value = null
}

const refreshReports = async (itemId: number) => {
  reportLoading.value = true
  try {
    reportList.value = await store.getReports(itemId)
  }
  finally {
    reportLoading.value = false
  }
}

const openReportDialog = async (item: MyTaskItem) => {
  reportItem.value = item
  resetReportForm()
  reportTab.value = 'form'
  reportDialog.value = true
  await refreshReports(item.id)
}

const startEditReport = (report: MyTaskReport) => {
  editingReport.value = report
  reportForm.value = {
    completed_at: report.completed_at || '',
    report_document_number: report.report_document_number || '',
    report_document_excerpt: report.report_document_excerpt || '',
    report_document_content: report.report_document_content || '',
    files: [],
    removeAttachmentIds: [],
  }
  reportTab.value = 'form'
}

const onReportFilesChange = (e: Event) => {
  const input = e.target as HTMLInputElement

  if (input.files)
    reportForm.value.files = [...reportForm.value.files, ...Array.from(input.files)]
  input.value = ''
}

const removeSelectedFile = (index: number) => {
  reportForm.value.files.splice(index, 1)
}

const submitReport = async () => {
  if (!reportItem.value)
    return
  reportSubmitting.value = true
  try {
    const data = {
      completed_at: normalizeDate(reportForm.value.completed_at) || undefined,
      report_document_number: reportForm.value.report_document_number || undefined,
      report_document_excerpt: reportForm.value.report_document_excerpt || undefined,
      report_document_content: reportForm.value.report_document_content || undefined,
      files: reportForm.value.files.length ? reportForm.value.files : undefined,
      remove_attachment_ids: reportForm.value.removeAttachmentIds.length
        ? reportForm.value.removeAttachmentIds
        : undefined,
    }

    if (editingReport.value) {
      await store.updateReport(editingReport.value.id, data)
      showToast('Cập nhật báo cáo thành công!', 'success')
    }
    else {
      await store.createReport(reportItem.value.id, data)
      showToast('Nộp báo cáo thành công!', 'success')
    }

    resetReportForm()
    reportTab.value = 'history'
    await refreshReports(reportItem.value.id)
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Thao tác thất bại!'), 'error')
  }
  finally {
    reportSubmitting.value = false
  }
}

// ── Pagination ────────────────────────────────────────────────────
const handlePageChange = (newPage: number) => {
  store.setFilters({ page: newPage })
  loadItems()
}

const handleLimitChange = (newLimit: number) => {
  store.setFilters({ page: 1, limit: newLimit })
  loadItems()
}

onMounted(async () => {
  store.setFilters({ sort_by: 'end_at', sort_order: 'asc' })
  loadStats()
  await Promise.all([loadItems(), loadFilterOptions()])
})
</script>

<template>
  <div>
    <!-- Stats Header -->
    <AppSystemPageHeader
      title="Công việc của tôi"
      :total="store.stats?.total ?? 0"
      :active="store.stats?.done ?? 0"
      :total-group="store.stats?.in_progress ?? 0"
      :inactive="store.stats?.overdue ?? 0"
      total-label="Tổng công việc"
      active-label="Hoàn thành"
      total-group-label="Đang thực hiện"
      inactive-label="Quá hạn"
      total-icon="tabler-checklist"
      active-icon="tabler-circle-check"
      total-group-icon="tabler-loader"
      inactive-icon="tabler-alert-circle"
      :show-settings="false"
    />

    <!-- Filter & Table -->
    <AppFilterBar
      title="Danh sách công việc"
      :has-active-filters="hasActiveFilters"
    >
      <template #filters>
        <!-- Search -->
        <VCol
          cols="12"
          sm="6"
          md="4"
        >
          <AppTextField
            v-model="searchQuery"
            placeholder="Tìm tên công việc..."
            prepend-inner-icon="tabler-search"
            clearable
            hide-details
          />
        </VCol>

        <!-- Status -->
        <VCol
          cols="12"
          sm="6"
          md="4"
        >
          <AppSelect
            v-model="statusFilter"
            :items="statusOptions"
            placeholder="Trạng thái xử lý"
            clearable
            hide-details
          />
        </VCol>

        <!-- Priority -->
        <VCol
          cols="12"
          sm="6"
          md="4"
        >
          <AppSelect
            v-model="priorityFilter"
            :items="priorityOptions"
            placeholder="Mức độ ưu tiên"
            clearable
            hide-details
          />
        </VCol>

        <!-- Department -->
        <VCol
          cols="12"
          sm="6"
          md="4"
        >
          <AppSelect
            v-model="departmentFilter"
            :items="departmentOptions"
            placeholder="Phòng ban"
            clearable
            hide-details
          />
        </VCol>

        <!-- Start Date Range -->
        <VCol
          cols="12"
          sm="6"
          md="4"
        >
          <AppDateTimePicker
            v-model="startDateRange"
            :config="{ mode: 'range', dateFormat: 'd/m/Y' }"
            clearable
            hide-details
            placeholder="Ngày bắt đầu (từ - đến)"
          />
        </VCol>

        <!-- End Date Range -->
        <VCol
          cols="12"
          sm="6"
          md="4"
        >
          <AppDateTimePicker
            v-model="endDateRange"
            :config="{ mode: 'range', dateFormat: 'd/m/Y' }"
            clearable
            hide-details
            placeholder="Thời hạn (từ - đến)"
          />
        </VCol>
      </template>

      <template #actions>
        <VBtn
          v-if="hasActiveFilters"
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-x"
          @click="resetFilters"
        >
          Xóa bộ lọc
        </VBtn>
      </template>

      <!-- Table -->
      <VDataTableServer
        :headers="headers"
        :items="store.items"
        :items-length="store.total"
        :loading="store.isLoading"
        item-value="id"
        hide-default-footer
        @update:options="handleTableUpdate"
      >
        <!-- STT -->
        <template #item.index="{ index }">
          <span class="text-body-1 text-high-emphasis">{{ indexOffset + index + 1 }}</span>
        </template>

        <!-- Name + Description -->
        <template #item.name="{ item }">
          <div class="d-flex flex-column gap-1 py-2">
            <span class="text-base font-weight-medium text-high-emphasis">{{ item.name }}</span>
          </div>
        </template>

        <!-- Document -->
        <template #item.document="{ item }">
          <div class="d-flex flex-column gap-1 py-1">
            <span
              v-if="item.document"
              class="text-body-1 text-high-emphasis"
            >{{ item.document.name }}</span>
            <span
              v-else
              class="text-disabled text-xs"
            >--</span>
          </div>
        </template>

        <!-- Vai trò của tôi -->
        <template #item.my_assignment="{ item }">
          <div
            v-if="item.my_assignment"
            class="d-flex flex-column align-center gap-1"
          >
            {{ resolveAssignmentRoleLabel(item.my_assignment.assignment_role) }}
          </div>
          <span
            v-else
            class="text-disabled text-xs"
          >—</span>
        </template>

        <!-- Status -->
        <template #item.processing_status="{ item }">
          <VChip
            size="small"
            :color="resolveStatusColor(item.processing_status)"
            class="font-weight-medium"
          >
            {{ resolveStatusLabel(item.processing_status) }}
          </VChip>
        </template>

        <!-- Priority -->
        <template #item.priority="{ item }">
          <VChip
            v-if="item.priority"
            size="small"
            :color="resolvePriorityColor(item.priority)"
            variant="tonal"
          >
            {{ resolvePriorityLabel(item.priority) }}
          </VChip>
          <span
            v-else
            class="text-disabled"
          >—</span>
        </template>

         <!-- Thời hạn -->
        <template #item.dates="{ item }">
           <span
            v-if="item.end_at && item.deadline_type !== 'no_deadline' "
            class="text-sm"
          >{{ formatDate(item.end_at) }} </span>
          <span
            v-else
            class="text-sm"
          >Không có thời hạn</span>
        </template>

        <!-- Completion Percent -->
        <template #item.completion_percent="{ item }">
          <div class="d-flex flex-column align-center gap-1">
            <span class="text-sm font-weight-medium">{{ item.completion_percent }}%</span>
          </div>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex justify-center">
            <VBtn
              icon
              variant="text"
              size="small"
            >
              <VIcon icon="tabler-dots-vertical" />
              <VMenu activator="parent">
                <VList density="compact">
                  <VListItem
                    prepend-icon="tabler-progress"
                    title="Cập nhật tiến độ"
                    :disabled="['done', 'cancelled'].includes(item.processing_status)"
                    @click="openProgressDialog(item)"
                  />
                  <VListItem
                    prepend-icon="tabler-file-report"
                    title="Báo cáo thực hiện"
                    @click="openReportDialog(item)"
                  />
                </VList>
              </VMenu>
            </VBtn>
          </div>
        </template>

        <template #bottom>
          <AppPagination
            :total="store.total"
            :page="store.filters.page ?? 1"
            :limit="store.filters.limit ?? 15"
            @update:page="handlePageChange"
            @update:limit="handleLimitChange"
          />
        </template>
      </VDataTableServer>
    </AppFilterBar>

    <!-- ── Progress Update Dialog ─────────────────────────────────── -->
    <VDialog
      v-model="progressDialog"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="pa-4 pb-2 d-flex align-center gap-2">
          <VIcon icon="tabler-progress" />
          Cập nhật tiến độ
        </VCardTitle>
        <VDivider />
        <VCardText class="pt-4">
          <!-- Thông tin công việc -->
          <div
            v-if="progressItem"
            class="mb-4 pa-3 rounded"
            style="background: rgba(var(--v-theme-on-surface), 0.04);"
          >
            <div class="text-base font-weight-medium text-high-emphasis">
              {{ progressItem.name }}
            </div>
            <!-- Thời hạn + cảnh báo -->
            <div
              v-if="progressItem.deadline_type === 'has_deadline' && progressItem.end_at"
              class="d-flex align-center gap-1 mt-2"
              :class="`text-${resolveDeadlineAlertColor(progressItem.deadline_alert_color)}`"
            >
              <VIcon
                icon="tabler-calendar-due"
                size="14"
                :color="resolveDeadlineAlertColor(progressItem.deadline_alert_color)"
              />
              <span class="text-xs font-weight-medium">Hạn: {{ formatDate(progressItem.end_at) }}</span>
              <VChip
                v-if="progressItem.days_remaining !== null && progressItem.days_remaining !== undefined"
                size="x-small"
                :color="resolveDeadlineAlertColor(progressItem.deadline_alert_color)"
                variant="tonal"
              >
                {{ progressItem.days_remaining === 0 ? 'Hôm nay' : `còn ${progressItem.days_remaining} ngày` }}
              </VChip>
            </div>
          </div>

          <VRow>

            <VCol cols="12">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-body-2 font-weight-medium">% Hoàn thành</span>
                <VChip
                  size="small"
                  :color="resolveStatusColor(progressStatus)"
                >
                  {{ progressPercent }}%
                </VChip>
              </div>
              <VSlider
                v-model="progressPercent"
                :min="0"
                :max="100"
                :step="5"
                :color="resolveStatusColor(progressStatus)"
                hide-details
                thumb-label
              />
            </VCol>

            <VCol cols="12">
              <AppTextarea
                v-model="progressNote"
                label="Ghi chú tiến độ"
                placeholder="Mô tả tiến độ hiện tại"
                rows="3"
                hide-details
              />
            </VCol>
          </VRow>
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4 gap-2 justify-end">
          <VBtn
            variant="tonal"
            color="secondary"
            :disabled="progressLoading"
            @click="progressDialog = false"
          >
            Hủy
          </VBtn>
          <VBtn
            color="primary"
            :loading="progressLoading"
            @click="submitProgress"
          >
            Lưu tiến độ
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- ── Report Dialog ──────────────────────────────────────────── -->
    <VDialog
      v-model="reportDialog"
      max-width="720"
      scrollable
    >
      <VCard>
        <VCardTitle class="pa-4 pb-2 d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <VIcon icon="tabler-file-report" />
            Báo cáo thực hiện công việc
          </div>
          <VBtn
            icon
            variant="text"
            size="small"
            @click="reportDialog = false; resetReportForm()"
          >
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <div
          v-if="reportItem"
          class="px-4 py-2"
          style="background: rgba(var(--v-theme-on-surface), 0.04);"
        >
          <span class="text-base font-weight-medium">{{ reportItem.name }}</span>
        </div>

        <VDivider />

        <VTabs
          v-model="reportTab"
          class="px-4"
        >
          <VTab value="form">
            {{ editingReport ? 'Chỉnh sửa báo cáo' : 'Nộp báo cáo mới' }}
          </VTab>
          <VTab value="history">
            Lịch sử báo cáo
            <VBadge
              v-if="reportList.length"
              :content="reportList.length"
              color="primary"
              inline
              class="ms-1"
            />
          </VTab>
        </VTabs>

        <VDivider />

        <VCardText class="pt-4">
          <VTabsWindow v-model="reportTab">
            <!-- Form Tab -->
            <VTabsWindowItem value="form">
              <VRow>
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppDateTimePicker
                    v-model="reportForm.completed_at"
                    :config="{ dateFormat: 'd/m/Y' }"
                    label="Ngày hoàn thành"
                    clearable
                    hide-details
                  />
                </VCol>

                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppTextField
                    v-model="reportForm.report_document_number"
                    label="Số hiệu"
                    hide-details
                  />
                </VCol>

                <VCol cols="12">
                  <AppTextField
                    v-model="reportForm.report_document_excerpt"
                    label="Trích yếu"
                    placeholder=""
                    hide-details
                  />
                </VCol>

                <VCol cols="12">
                  <AppTextarea
                    v-model="reportForm.report_document_content"
                    label="Nội dung báo cáo"
                    placeholder="Nhập nội dung chi tiết báo cáo thực hiện công việc..."
                    rows="5"
                    hide-details
                  />
                </VCol>

                <!-- File Attachments -->
                <VCol cols="12">
                  <div class="text-body-2 mb-2">
                    Tệp đính kèm
                  </div>
                  <VBtn
                    variant="tonal"
                    color="secondary"
                    prepend-icon="tabler-paperclip"
                    size="small"
                    @click="reportFileInput?.click()"
                  >
                    Chọn tệp
                  </VBtn>
                  <input
                    ref="reportFileInput"
                    type="file"
                    multiple
                    class="d-none"
                    @change="onReportFilesChange"
                  >

                  <!-- Tệp hiện có khi chỉnh sửa -->
                  <div
                    v-if="editingReport?.attachments?.length"
                    class="mt-2"
                  >
                    <div class="text-xs text-medium-emphasis mb-1">
                      Tệp hiện có:
                    </div>
                    <div class="d-flex flex-wrap gap-1">
                      <VChip
                        v-for="att in editingReport.attachments"
                        :key="att.id"
                        size="small"
                        prepend-icon="tabler-paperclip"
                        :class="reportForm.removeAttachmentIds.includes(att.id) ? 'text-decoration-line-through opacity-50' : ''"
                        closable
                        @click:close="reportForm.removeAttachmentIds.push(att.id)"
                      >
                        <a
                          :href="att.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-decoration-none text-high-emphasis"
                        >{{ att.file_name }}</a>
                      </VChip>
                    </div>
                  </div>

                  <!-- Tệp mới chọn -->
                  <div
                    v-if="reportForm.files.length"
                    class="mt-2 d-flex flex-wrap gap-1"
                  >
                    <VChip
                      v-for="(f, i) in reportForm.files"
                      :key="i"
                      size="small"
                      color="primary"
                      variant="tonal"
                      closable
                      @click:close="removeSelectedFile(i)"
                    >
                      {{ f.name }}
                    </VChip>
                  </div>
                </VCol>
              </VRow>

              <div class="d-flex gap-2 justify-end mt-4">
                <VBtn
                  v-if="editingReport"
                  variant="tonal"
                  color="secondary"
                  :disabled="reportSubmitting"
                  @click="resetReportForm"
                >
                  Hủy
                </VBtn>
                <VBtn
                  color="primary"
                  :loading="reportSubmitting"
                  @click="submitReport"
                >
                  {{ editingReport ? 'Cập nhật' : 'Nộp' }}
                </VBtn>
              </div>
            </VTabsWindowItem>

            <!-- History Tab -->
            <VTabsWindowItem value="history">
  <div v-if="reportLoading" class="report-history-skeleton">
    <VSkeletonLoader type="article, actions" />
    <VSkeletonLoader type="article, actions" class="mt-4" />
  </div>

  <div
    v-else-if="!reportList.length"
    class="report-empty-state d-flex flex-column align-center justify-center text-center"
  >
    <VAvatar
      size="72"
      variant="tonal"
      color="secondary"
      class="mb-4"
    >
      <VIcon icon="tabler-file-off" size="34" />
    </VAvatar>

    <div class="text-h6 font-weight-medium mb-2">
      Chưa có báo cáo nào
    </div>

    <div class="text-body-1 text-medium-emphasis mb-4">
      Hãy tạo báo cáo đầu tiên cho công việc này để theo dõi tiến độ xử lý.
    </div>

    <VBtn
      color="primary"
      prepend-icon="tabler-plus"
      @click="reportTab = 'form'"
    >
      Nộp báo cáo đầu tiên
    </VBtn>
  </div>

  <div v-else class="report-history-list">
    <VRow class="report-history-row">
      <VCol
        v-for="(report, index) in reportList"
        :key="report.id"
        cols="12"
      >
        <VCard class="report-history-card">
          <VCardText class="pa-5">
            <div class="d-flex align-start justify-space-between flex-wrap gap-4 mb-4">
              <div class="d-flex align-start gap-3 flex-grow-1 min-w-0">
                <VAvatar
                  size="44"
                  rounded
                  variant="tonal"
                  color="primary"
                >
                  <VIcon icon="tabler-file-description" size="22" />
                </VAvatar>

                <div class="flex-grow-1 min-w-0">
                  <div class="d-flex align-center flex-wrap gap-2 mb-2">
                    <div class="text-body-1 font-weight-bold text-high-emphasis">
                      Báo cáo #{{ reportList.length - index }}
                    </div>
                  </div>

                  <div class="d-flex flex-wrap gap-x-4 gap-y-2 text-body-2 text-medium-emphasis">
                    <div class="d-flex align-center gap-1">
                      <VIcon icon="tabler-calendar-check" size="16" />
                      <span>
                        Hoàn thành:
                        {{ dayjs( report.completed_at, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY') }} 
                      </span>
                    </div>

                    <div class="d-flex align-center gap-1">
                      <VIcon icon="tabler-clock-edit" size="16" />
                      <span>
                        Cập nhật:
                        {{ dayjs( report.updated_at, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY') }} 
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <VTooltip text="Chỉnh sửa báo cáo">
                <template #activator="{ props }">
                  <VBtn
                    v-bind="props"
                    icon
                    variant="tonal"
                    @click="startEditReport(report)"
                  >
                    <VIcon icon="tabler-edit" />
                  </VBtn>
                </template>
              </VTooltip>
            </div>

            <VDivider class="mb-4" />
            <div
              v-if="report.report_document_excerpt"
              class="report-section mb-4"
            >
              <div class="report-section-label">
                Số hiệu
              </div>
              <div class="report-section-content text-body-1 text-high-emphasis">
                {{ report.report_document_excerpt }}
              </div>
            </div>
            <div
              v-if="report.report_document_excerpt"
              class="report-section mb-4"
            >
              <div class="report-section-label">
                Trích yếu
              </div>
              <div class="report-section-content text-body-1 text-high-emphasis">
                {{ report.report_document_excerpt }}
              </div>
            </div>

            <div
              v-if="report.report_document_content"
              class="report-section mb-4"
            >
              <div class="report-section-label">
                Nội dung báo cáo
              </div>
              <div
                class="report-section-content report-content text-body-1 text-medium-emphasis"
              >
                {{ report.report_document_content }}
              </div>
            </div>

            <div
              v-if="report.attachments?.length"
              class="report-section"
            >
              <div class="report-section-label mb-2">
                Tệp đính kèm
              </div>

              <div class="d-flex flex-wrap gap-2">
                <VChip
                  v-for="att in report.attachments"
                  :key="att.id"
                  size="small"
                  color="secondary"
                  variant="tonal"
                  class="report-attachment-chip"
                >
                  <template #prepend>
                    <VIcon icon="tabler-paperclip" size="16" />
                  </template>

                  <a
                    :href="att.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="report-attachment-link"
                  >
                    {{ att.file_name }}
                  </a>
                </VChip>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</VTabsWindowItem>
          </VTabsWindow>
        </VCardText>
      </VCard>
    </VDialog>

    <AppSnackbar
      v-model="snackbar.show"
      :message="snackbar.message"
      :color="snackbar.color"
    />
  </div>
</template>
