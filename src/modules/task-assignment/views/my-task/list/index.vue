<!-- eslint-disable import/no-unresolved -->
<!-- eslint-disable import/extensions -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSystemPageHeader from '@/components/AppSystemPageHeader.vue'
import { useMyTaskAssignmentItemStore } from '../../../stores/useMyTaskAssignmentItemStore'
import type { MyTaskItem, MyTaskStatus } from '../../../services/myTaskItem'
import { taskAssignmentDepartmentApi } from '@/api/modules/task-assignment-department'
import { normalizeDate } from '@/utils/formatters'
import { MY_TASK_TABLE_HEADERS } from '../../../configs/myTaskOptions'
import ReportMyTask from '../../../components/ReportMyTask.vue'
import ProgressMyTask from '../../../components/ProgressMyTask.vue'
import { ITEM_STATUS_OPTIONS, ITEM_PRIORITY_OPTIONS } from '../../../configs/itemOptions'

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

const headers = MY_TASK_TABLE_HEADERS

const statusOptions = ITEM_STATUS_OPTIONS

const priorityOptions = ITEM_PRIORITY_OPTIONS

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

const openProgressDialog = (item: MyTaskItem) => {
  progressItem.value = item
  progressDialog.value = true
}

// ── Report Dialog ─────────────────────────────────────────────────
const reportDialog = ref(false)
const reportItem = ref<MyTaskItem | null>(null)

const openReportDialog = (item: MyTaskItem) => {
  reportItem.value = item
  reportDialog.value = true
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
    <ProgressMyTask
      v-model="progressDialog"
      :item="progressItem"
      @toast="showToast"
      @saved="loadStats"
    />

    <!-- ── Report Dialog ──────────────────────────────────────────── -->
    <ReportMyTask
      v-model="reportDialog"
      :item="reportItem"
      @toast="showToast"
    />
     <Report
    />
  </div>
</template>
