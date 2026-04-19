<!-- eslint-disable import/no-unresolved -->
<!-- eslint-disable import/extensions -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import ItemFormDrawer from '../../../components/ItemFormDrawer.vue'
import { getErrorMessage } from '@/utils/errorMessage'
import { normalizeDate } from '@/utils/formatters'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSystemPageHeader from '@/components/AppSystemPageHeader.vue'
import AppUserDateInfo from '@/components/AppUserDateInfo.vue'
import AppImportDialog from '@/components/AppImportDialog.vue'
import AppExportDialog from '@/components/AppExportDialog.vue'
import { useItemStore } from '../../../stores/useItemStore'
import type { Item, ItemStatus } from '../../../services/itemApi'
import { documentApi } from '../../../services/documentApi'
import { departmentApi } from '../../../services/departmentApi'
import { itemTypeApi } from '../../../services/itemTypeApi'
import { typeApi } from '../../../services/typeApi'
import { userApi } from '@/api/modules/user'
import { ITEM_TABLE_HEADERS, ITEM_STATUS_OPTIONS, ITEM_PRIORITY_OPTIONS, ITEM_LIMIT_OPTIONS, ITEM_DEADLINE_TYPE_OPTIONS } from '../../../configs/itemOptions'

const store = useItemStore()

const isFormDrawerVisible = ref(false)
const editingItem = ref<Item | null>(null)
const selected = ref<Item[]>([])
const isImportDialogVisible = ref(false)
const isExportDialogVisible = ref(false)
const isImporting = ref(false)
const isExporting = ref(false)
const isDownloadingTemplate = ref(false)

const searchQuery = ref('')
const statusFilter = ref<ItemStatus | null>(null)
const priorityFilter = ref<string | null>(null)
const deadlineTypeFilter = ref<string | null>(null)
const documentFilter = ref<number | null>(null)
const departmentFilter = ref<number | null>(null)
const itemTypeFilter = ref<number | null>(null)
const taskAssignmentTypeFilter = ref<number | null>(null)
const userFilter = ref<number | null>(null)
const assignmentRoleFilter = ref<string | null>(null)
const assignmentStatusFilter = ref<string | null>(null)
const completionPercentFrom = ref<number | ''>('')
const completionPercentTo = ref<number | ''>('')
const startDateRange = ref('')
const endDateRange = ref('')
const issueDateRange = ref('')

// Parse chuỗi range "dd/mm/yyyy to dd/mm/yyyy" → { from, to }
const parseDateRange = (range: string) => {
  const parts = range?.split(' to ')

  return {
    from: normalizeDate(parts?.[0]?.trim()),
    to: normalizeDate(parts?.[1]?.trim()),
  }
}

const confirmDialog = ref({ show: false, title: '', message: '', onConfirm: () => {} })
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  confirmDialog.value = { show: true, title, message, onConfirm }
}

// --- Bộ lọc văn bản giao việc (infinity scroll) ---
const documentOptions = ref<{ title: string; value: number }[]>([])
const documentPage = ref(1)
const documentTotal = ref(0)
const documentLoading = ref(false)
const documentHasMore = computed(() => documentOptions.value.length < documentTotal.value)

const loadDocumentFilterOptions = async (reset = false) => {
  if (documentLoading.value)
    return
  if (reset) {
    documentPage.value = 1
    documentOptions.value = []
  }
  documentLoading.value = true
  try {
    const res = await documentApi.list({ page: documentPage.value, limit: 20 })
    if (res.data.success) {
      const items = (res.data.data || []).map((d: any) => ({ title: d.name, value: d.id }))

      documentOptions.value = reset ? items : [...documentOptions.value, ...items]
      documentTotal.value = res.data.meta?.total || 0
      documentPage.value++
    }
  }
  catch { /* silent */ }
  finally { documentLoading.value = false }
}

const onDocumentFilterIntersect = (isIntersecting: boolean) => {
  if (isIntersecting && documentHasMore.value && !documentLoading.value)
    loadDocumentFilterOptions()
}

// --- Bộ lọc phòng ban ---
const departmentOptions = ref<{ title: string; value: number }[]>([])
const departmentLoading = ref(false)

const loadDepartmentFilterOptions = async () => {
  departmentLoading.value = true
  try {
    const res = await departmentApi.list({ limit: 100, status: 'active' })
    if (res.data.success)
      departmentOptions.value = (res.data.data || []).map((d: any) => ({ title: d.name, value: d.id }))
  }
  catch { /* silent */ }
  finally { departmentLoading.value = false }
}

// --- Bộ lọc loại công việc ---
const itemTypeOptions = ref<{ title: string; value: number }[]>([])
const itemTypeLoading = ref(false)

const loadItemTypeFilterOptions = async () => {
  itemTypeLoading.value = true
  try {
    const res = await itemTypeApi.list({ limit: 100, status: 'active' })
    if (res.data.success)
      itemTypeOptions.value = (res.data.data || []).map((t: any) => ({ title: t.name, value: t.id }))
  }
  catch { /* silent */ }
  finally { itemTypeLoading.value = false }
}

// --- Bộ lọc loại văn bản ---
const taskAssignmentTypeOptions = ref<{ title: string; value: number }[]>([])
const taskAssignmentTypeLoading = ref(false)

const loadTaskAssignmentTypeOptions = async () => {
  taskAssignmentTypeLoading.value = true
  try {
    const res = await typeApi.list({ limit: 100, status: 'active' })
    if (res.data.success)
      taskAssignmentTypeOptions.value = (res.data.data || []).map((t: any) => ({ title: t.name, value: t.id }))
  }
  catch { /* silent */ }
  finally { taskAssignmentTypeLoading.value = false }
}

// --- Bộ lọc người dùng (infinity scroll) ---
const userOptions = ref<{ title: string; value: number }[]>([])
const userPage = ref(1)
const userTotal = ref(0)
const userLoading = ref(false)
const userHasMore = computed(() => userOptions.value.length < userTotal.value)

const loadUserFilterOptions = async (reset = false) => {
  if (userLoading.value)
    return
  if (reset) {
    userPage.value = 1
    userOptions.value = []
  }
  userLoading.value = true
  try {
    const res = await userApi.list({ page: userPage.value, limit: 20 })
    if (res.data.success) {
      const items = (res.data.data || []).map((u: any) => ({ title: u.name, value: u.id }))

      userOptions.value = reset ? items : [...userOptions.value, ...items]
      userTotal.value = res.data.meta?.total || 0
      userPage.value++
    }
  }
  catch { /* silent */ }
  finally { userLoading.value = false }
}

const onUserFilterIntersect = (isIntersecting: boolean) => {
  if (isIntersecting && userHasMore.value && !userLoading.value)
    loadUserFilterOptions()
}

// --- Table ---
const isLoading = computed(() => store.isLoading)
const selectedIds = computed(() => selected.value.map(d => d.id))
const indexOffset = computed(() => ((store.filters.page ?? 1) - 1) * (store.filters.limit ?? 15))
const selectedHasIssued = computed(() => selected.value.some(d => d.document?.status === 'issued'))

const hasActiveFilters = computed(() =>
  !!searchQuery.value
  || !!statusFilter.value
  || !!priorityFilter.value
  || !!deadlineTypeFilter.value
  || !!documentFilter.value
  || !!departmentFilter.value
  || !!itemTypeFilter.value
  || !!taskAssignmentTypeFilter.value
  || !!userFilter.value
  || !!assignmentRoleFilter.value
  || !!assignmentStatusFilter.value
  || completionPercentFrom.value !== ''
  || completionPercentTo.value !== ''
  || !!startDateRange.value
  || !!endDateRange.value
  || !!issueDateRange.value,
)

const headers = ITEM_TABLE_HEADERS

const statusOptions = ITEM_STATUS_OPTIONS

const priorityOptions = ITEM_PRIORITY_OPTIONS

const deadlineTypeOptions = ITEM_DEADLINE_TYPE_OPTIONS

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

// --- Load ---
const loadItems = async () => {
  const startRange = parseDateRange(startDateRange.value)
  const endRange = parseDateRange(endDateRange.value)
  const issueRange = parseDateRange(issueDateRange.value)

  await store.fetchItems({
    page: store.filters.page,
    limit: store.filters.limit,
    search: searchQuery.value || undefined,
    processing_status: (statusFilter.value as ItemStatus) || undefined,
    priority: priorityFilter.value as any || undefined,
    deadline_type: deadlineTypeFilter.value as any || undefined,
    completion_percent_from: completionPercentFrom.value !== '' ? Number(completionPercentFrom.value) : undefined,
    completion_percent_to: completionPercentTo.value !== '' ? Number(completionPercentTo.value) : undefined,
    start_from: startRange.from,
    start_to: startRange.to,
    end_from: endRange.from,
    end_to: endRange.to,
    from_date: issueRange.from,
    to_date: issueRange.to,
    task_assignment_document_id: documentFilter.value || undefined,
    task_assignment_item_type_id: itemTypeFilter.value || undefined,
    task_assignment_type_id: taskAssignmentTypeFilter.value || undefined,
    department_id: departmentFilter.value || undefined,
    user_id: userFilter.value || undefined,
    assignment_role: assignmentRoleFilter.value as any || undefined,
    assignment_status: assignmentStatusFilter.value as any || undefined,
    sort_by: store.filters.sort_by,
    sort_order: store.filters.sort_order,
  })
}

const handleTableUpdate = (options: any) => {
  const sortBy = options.sortBy?.[0]
  const newSortBy = sortBy?.key as any || 'created_at'
  const newSortOrder = sortBy?.order || 'desc'

  if (newSortBy !== store.filters.sort_by || newSortOrder !== store.filters.sort_order) {
    store.setFilters({ sort_by: newSortBy, sort_order: newSortOrder })
    loadItems()
  }
}

// --- CRUD ---
const openCreateDrawer = () => {
  editingItem.value = null
  isFormDrawerVisible.value = true
}

const openEditDrawer = (item: Item) => {
  editingItem.value = item
  isFormDrawerVisible.value = true
}

const handleFormSubmit = async () => {
  isFormDrawerVisible.value = false
  await Promise.all([loadItems(), store.fetchStats()])
}

const isDeleteDialogVisible = ref(false)
const deletingId = ref<number | null>(null)

const confirmDeleteSingle = (id: number) => {
  deletingId.value = id
  isDeleteDialogVisible.value = true
}

const confirmBulkDelete = () => {
  if (!selectedIds.value.length)
    return
  deletingId.value = null
  isDeleteDialogVisible.value = true
}

const handleDeleteConfirm = async () => {
  try {
    if (deletingId.value !== null) {
      await store.deleteItem(deletingId.value)
      showToast('Xóa công việc thành công!', 'success')
    }
    else {
      await store.bulkDelete(selectedIds.value)
      showToast(`Đã xóa ${selectedIds.value.length} công việc!`, 'success')
      selected.value = []
    }
    isDeleteDialogVisible.value = false
    await Promise.all([loadItems(), store.fetchStats()])
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Xóa thất bại!'), 'error')
    isDeleteDialogVisible.value = false
  }
}

const handleBulkStatus = (status: ItemStatus) => {
  if (!selectedIds.value.length)
    return

  const label = resolveStatusLabel(status)

  showConfirm(
    'Cập nhật trạng thái hàng loạt',
    `Bạn có chắc muốn chuyển ${selectedIds.value.length} công việc sang trạng thái "${label}"?`,
    async () => {
      try {
        await store.bulkUpdateStatus(selectedIds.value, status)
        selected.value = []
        showToast('Cập nhật trạng thái thành công!', 'success')
        await Promise.all([loadItems(), store.fetchStats()])
      }
      catch (err: any) {
        showToast(getErrorMessage(err, 'Cập nhật trạng thái thất bại!'), 'error')
      }
    },
  )
}

const handleExport = async (scope: string) => {
  isExporting.value = true
  try {
    const exportFilters = scope !== 'all'
      ? {
          search: searchQuery.value || undefined,
          status: (statusFilter.value as ItemStatus) || undefined,
          priority: priorityFilter.value as any || undefined,
          task_assignment_document_id: documentFilter.value || undefined,
          department_id: departmentFilter.value || undefined,
          task_assignment_item_type_id: itemTypeFilter.value || undefined,
        }
      : undefined

    await store.exportItems(exportFilters)
    showToast('Xuất file thành công!', 'success')
    isExportDialogVisible.value = false
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Xuất file thất bại!'), 'error')
  }
  finally {
    isExporting.value = false
  }
}

const handleImport = async (file: File) => {
  isImporting.value = true
  try {
    await store.importItems(file)
    showToast('Nhập dữ liệu thành công!', 'success')
    isImportDialogVisible.value = false
    await Promise.all([loadItems(), store.fetchStats()])
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Nhập dữ liệu thất bại!'), 'error')
  }
  finally {
    isImporting.value = false
  }
}

const handleDownloadTemplate = async () => {
  isDownloadingTemplate.value = true
  try {
    await store.downloadTemplate()
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Tải file mẫu thất bại!'), 'error')
  }
  finally {
    isDownloadingTemplate.value = false
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

watch([
  statusFilter,
  priorityFilter,
  deadlineTypeFilter,
  documentFilter,
  departmentFilter,
  itemTypeFilter,
  taskAssignmentTypeFilter,
  userFilter,
  assignmentRoleFilter,
  assignmentStatusFilter,
  completionPercentFrom,
  completionPercentTo,
  startDateRange,
  endDateRange,
  issueDateRange,
], () => {
  store.setFilters({ page: 1 })
  loadItems()
})

onMounted(async () => {
  await Promise.all([
    store.fetchStats(),
    loadItems(),
    loadDocumentFilterOptions(true),
    loadDepartmentFilterOptions(),
    loadItemTypeFilterOptions(),
    loadTaskAssignmentTypeOptions(),
    loadUserFilterOptions(true),
  ])
})
</script>

<template>
  <section>
    <!-- Header thống kê: tổng / hoàn thành / đang thực hiện / quá hạn -->
    <AppSystemPageHeader
      title="Công việc"
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

    <!-- Filter & Actions Bar -->
    <AppFilterBar :has-active-filters="hasActiveFilters">
      <template #filters>
        <!-- Hàng 1: Tìm kiếm + Trạng thái + Ưu tiên + Loại thời hạn -->
        <VRow
          dense
          style="width: 100%;"
        >
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="searchQuery"
              placeholder="Tên công việc..."
              prepend-inner-icon="tabler-search"
              hide-details
            />
          </VCol>
          <VCol
            cols="6"
            md="3"
          >
            <AppSelect
              v-model="priorityFilter"
              placeholder="Chọn ưu tiên"
              :items="priorityOptions"
              clearable
              hide-details
            />
          </VCol>
          <VCol
            cols="6"
            md="3"
          >
            <AppSelect
              v-model="deadlineTypeFilter"
              placeholder="Chọn loại"
              :items="deadlineTypeOptions"
              clearable
              hide-details
            />
          </VCol>
        </VRow>

        <!-- Hàng 2: % hoàn thành + Ngày bắt đầu + Ngày kết thúc + Ngày ban hành -->
        <VRow
          dense
          style="width: 100%;"
        >
          <VCol
            cols="6"
            md="3"
          >
            <div class="d-flex gap-2">
              <div style="flex: 1; min-width: 0;">
                <AppTextField
                  v-model.number="completionPercentFrom"
                  placeholder="% Hoàn thành từ"
                  type="number"
                  hide-details
                />
              </div>
              <div style="flex: 1; min-width: 0;">
                <AppTextField
                  v-model.number="completionPercentTo"
                  placeholder="% Hoàn thành đến"
                  type="number"
                  hide-details
                />
              </div>
            </div>
          </VCol>
          <VCol
            cols="6"
            md="3"
          >
            <AppDateTimePicker
              v-model="startDateRange"
              placeholder="Ngày bắt đầu (từ- đến)"
              :config="{ mode: 'range', dateFormat: 'd/m/Y' }"
              clearable
              hide-details
            />
          </VCol>
          <VCol
            cols="6"
            md="3"
          >
            <AppDateTimePicker
              v-model="endDateRange"
              placeholder="Ngày kết thúc (từ- đến)"
              :config="{ mode: 'range', dateFormat: 'd/m/Y' }"
              clearable
              hide-details
            />
          </VCol>
          <VCol
            cols="6"
            md="3"
          >
            <AppDateTimePicker
              v-model="issueDateRange"
              placeholder="Ngày ban hành (từ - ngày)"
              :config="{ mode: 'range', dateFormat: 'd/m/Y' }"
              clearable
              hide-details
            />
          </VCol>
        </VRow>

        <!-- Hàng 3: Văn bản + Loại văn bản + Loại CV + Phòng ban -->
        <VRow
          dense
          style="width: 100%;"
        >
          <VCol
            cols="6"
            md="3"
          >
            <VAutocomplete
              v-model="documentFilter"
              placeholder="Chọn văn bản giao việc"
              :items="documentOptions"
              item-title="title"
              item-value="value"
              clearable
              hide-details
              hide-no-data
            >
              <template #append-item>
                <div
                  v-if="documentHasMore || documentLoading"
                  v-intersect="{ handler: onDocumentFilterIntersect, options: { threshold: 0.5 } }"
                  class="d-flex justify-center pa-2"
                >
                  <VProgressCircular
                    v-if="documentLoading"
                    indeterminate
                    size="18"
                    width="2"
                  />
                </div>
              </template>
            </VAutocomplete>
          </VCol>
          <VCol
            cols="6"
            md="3"
          >
            <VAutocomplete
              v-model="taskAssignmentTypeFilter"
              placeholder="Chọn loại văn bản"
              :items="taskAssignmentTypeOptions"
              item-title="title"
              item-value="value"
              clearable
              hide-details
              hide-no-data
            />
          </VCol>
          <VCol
            cols="6"
            md="3"
          >
            <VAutocomplete
              v-model="itemTypeFilter"
              placeholder="Chọn loại công việc"
              :items="itemTypeOptions"
              item-title="title"
              item-value="value"
              clearable
              hide-details
              hide-no-data
            />
          </VCol>
          <VCol
            cols="6"
            md="3"
          >
            <VAutocomplete
              v-model="departmentFilter"
              placeholder="Chọn phòng ban"
              :items="departmentOptions"
              item-title="title"
              item-value="value"
              clearable
              hide-details
              hide-no-data
            />
          </VCol>
        </VRow>

        <!-- Hàng 4: Người dùng + Vai trò + Trạng thái nhận -->
        <VRow
          dense
          style="width: 100%;"
        >
          <VCol
            cols="6"
            md="3"
          >
            <VAutocomplete
              v-model="userFilter"
              placeholder="Chọn người dùng"
              :items="userOptions"
              item-title="title"
              item-value="value"
              clearable
              hide-details
              hide-no-data
            >
              <template #append-item>
                <div
                  v-if="userHasMore || userLoading"
                  v-intersect="{ handler: onUserFilterIntersect, options: { threshold: 0.5 } }"
                  class="d-flex justify-center pa-2"
                >
                  <VProgressCircular
                    v-if="userLoading"
                    indeterminate
                    size="18"
                    width="2"
                  />
                </div>
              </template>
            </VAutocomplete>
          </VCol>
          <VCol
            cols="6"
            md="3"
          >
            <AppSelect
              v-model="assignmentRoleFilter"
              placeholder="Chọn vai trò"
              :items="[
                { title: 'Chủ trì', value: 'main' },
                { title: 'Phối hợp', value: 'support' },
              ]"
              clearable
              hide-details
            />
          </VCol>
          <VCol
            cols="6"
            md="3"
          >
            <AppSelect
              v-model="assignmentStatusFilter"
              placeholder="Chọn trạng thái nhận việc"
              :items="[
                { title: 'Đã giao', value: 'assigned' },
                { title: 'Đã nhận', value: 'accepted' },
                { title: 'Từ chối', value: 'rejected' },
                { title: 'Hoàn thành', value: 'done' },
              ]"
              clearable
              hide-details
            />
          </VCol>
          <VCol
            cols="6"
            md="3"
          >
            <AppSelect
              v-model="statusFilter"
              placeholder="Chọn trạng thái xử lý"
              :items="statusOptions"
              clearable
              hide-details
            />
          </VCol>
        </VRow>
      </template>

      <template #actions>
        <!-- Bulk actions -->
        <template v-if="selectedIds.length > 0">
          <VBtn
            variant="tonal"
            color="success"
            prepend-icon="tabler-circle-check"
            :disabled="selectedHasIssued"
            @click="handleBulkStatus('done')"
          >
            <span class="d-none d-sm-inline">Hoàn thành</span>
            ({{ selectedIds.length }})
            <VTooltip
              v-if="selectedHasIssued"
              activator="parent"
              location="top"
            >
              Có công việc thuộc văn bản đã ban hành
            </VTooltip>
          </VBtn>
          <VBtn
            variant="tonal"
            color="info"
            prepend-icon="tabler-loader"
            :disabled="selectedHasIssued"
            @click="handleBulkStatus('in_progress')"
          >
            <span class="d-none d-sm-inline">Đang thực hiện</span>
            ({{ selectedIds.length }})
          </VBtn>
          <VBtn
            variant="tonal"
            color="error"
            prepend-icon="tabler-alert-circle"
            :disabled="selectedHasIssued"
            @click="handleBulkStatus('overdue')"
          >
            <span class="d-none d-sm-inline">Quá hạn</span>
            ({{ selectedIds.length }})
          </VBtn>
          <VBtn
            variant="tonal"
            color="warning"
            prepend-icon="tabler-player-pause"
            :disabled="selectedHasIssued"
            @click="handleBulkStatus('paused')"
          >
            <span class="d-none d-sm-inline">Tạm dừng</span>
            ({{ selectedIds.length }})
          </VBtn>
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="tabler-x"
            :disabled="selectedHasIssued"
            @click="handleBulkStatus('cancelled')"
          >
            <span class="d-none d-sm-inline">Đã hủy</span>
            ({{ selectedIds.length }})
          </VBtn>
          <VBtn
            variant="tonal"
            color="error"
            prepend-icon="tabler-trash"
            :disabled="selectedHasIssued"
            @click="confirmBulkDelete"
          >
            <span class="d-none d-sm-inline">Xóa</span>
            ({{ selectedIds.length }})
          </VBtn>
        </template>

        <!-- Import -->
        <VBtn
          color="secondary"
          variant="tonal"
          @click="isImportDialogVisible = true"
        >
          <VIcon icon="tabler-upload" />
          <span class="d-none d-sm-inline ms-1">Nhập</span>
        </VBtn>

        <!-- Export -->
        <VBtn
          color="secondary"
          variant="tonal"
          @click="isExportDialogVisible = true"
        >
          <VIcon icon="tabler-download" />
          <span class="d-none d-sm-inline ms-1">Xuất</span>
        </VBtn>

        <!-- Add -->
        <VBtn @click="openCreateDrawer">
          <VIcon icon="tabler-plus" />
          <span class="d-none d-sm-inline ms-1">Thêm mới</span>
        </VBtn>
      </template>

      <!-- Table (default slot) -->
      <VDataTableServer
        v-model="selected"
        :headers="headers"
        :items="store.items"
        :items-length="store.total"
        item-value="id"
        item-height="64"
        show-select
        return-object
        class="text-no-wrap"
        @update:options="handleTableUpdate"
      >
        <!-- STT -->
        <template #item.index="{ index }">
          <span class="text-base font-weight-medium text-high-emphasis">{{ indexOffset + index + 1 }}</span>
        </template>

        <!-- Tên công việc -->
        <template #item.name="{ item }">
          <div>
            <div class="d-flex flex-column">
              <span class="text-base font-weight-medium text-high-emphasis"> {{ item.name }} </span>
            </div>
          </div>
        </template>

        <!-- Văn bản -->
        <template #item.document="{ item }">
          <RouterLink
            v-if="item.document"
            :to="{ name: 'task-assignment-documents-id', params: { id: item.document.id } }"
            class="text-link font-weight-medium d-inline-block"
          >
            {{ item.document.name }}
          </RouterLink>
          <span v-else class="text-xs text-disabled">—</span>
        </template>

        <!-- Phòng ban -->
        <template #item.departments="{ item }">
          <div
            v-if="item.departments && item.departments.length"
            class="d-flex flex-wrap gap-1"
          >
            <VChip
              v-for="dept in item.departments"
              :key="dept.id"
              variant="tonal"
            >
              {{ dept.name }}
            </VChip>
          </div>
          <span
            v-else
            class="text-xs text-disabled"
          >—</span>
        </template>

        <!-- Trạng thái -->
        <template #item.processing_status="{ item }">
          <VChip
            :color="resolveStatusColor(item.processing_status)"
            size="small"
            variant="tonal"
          >
            {{ resolveStatusLabel(item.processing_status) }}
          </VChip>
        </template>

        <!-- Ưu tiên -->
        <template #item.priority="{ item }">
          <VChip
            v-if="item.priority"
            :color="resolvePriorityColor(item.priority)"
            size="small"
            variant="tonal"
          >
            {{ resolvePriorityLabel(item.priority) }}
          </VChip>
          <span
            v-else
            class="text-xs text-disabled"
          >—</span>
        </template>

        <!-- Thời hạn -->
        <template #item.end_at="{ item }">
          <span
            v-if="item.end_at && item.deadline_type !== 'no_deadline' "
            class="text-base font-weight-medium text-high-emphasis"
          >{{ dayjs(item.end_at, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY') }} </span>
          <span
            v-else
            class="text-base font-weight-medium text-high-emphasis"
          >Không có thời hạn</span>
        </template>

        <!-- % Hoàn thành -->
        <template #item.completion_percent="{ item }">
          <div class="d-flex flex-column align-center gap-1">
            <span class="text-base font-weight-medium text-high-emphasis">{{ item.completion_percent }}%</span>
            <!--
              <VProgressLinear
              :model-value="item.completion_percent"
              :color="item.completion_percent >= 100 ? 'success' : 'primary'"
              height="4"
              rounded
              style="min-inline-size: 52px;"
              />
            -->
          </div>
        </template>

        <!-- Ngày tạo -->
        <template #item.created_at="{ item }">
          <div style="max-width: 160px; overflow: hidden;">
            <AppUserDateInfo
              :user="item.created_by"
              :date="item.created_at"
            />
          </div>
        </template>

        <!-- Ngày cập nhật  -->
        <template #item.updated_at="{ item }">
          <div style="max-width: 160px; overflow: hidden;">
            <AppUserDateInfo
              :user="item.updated_by"
              :date="item.updated_at"
            />
          </div>
        </template>

        <!-- Hành động -->
        <template #item.actions="{ item }">
          <IconBtn @click="openEditDrawer(item)">
            <VIcon :icon="item.document?.status === 'issued' ? 'tabler-eye' : 'tabler-edit'" />
          </IconBtn>

          <IconBtn
            color="error"
            :disabled="item.document?.status === 'issued'"
            @click="item.document?.status !== 'issued' && confirmDeleteSingle(item.id)"
          >
            <VIcon icon="tabler-trash" />
          </IconBtn>
        </template>

        <!-- No Data -->
        <template #no-data>
          <div class="text-center py-8">
            <VIcon
              icon="tabler-checklist"
              size="48"
              color="disabled"
              class="mb-4"
            />
            <div class="text-sm text-disabled">
              Không có công việc nào
            </div>
          </div>
        </template>

        <template #bottom>
          <AppPagination
            :page="store.filters.page || 1"
            :limit="store.filters.limit || 15"
            :total="store.total"
            :limit-options="ITEM_LIMIT_OPTIONS"
            :loading="isLoading"
            @update:page="(p) => { store.setFilters({ page: p }); loadItems() }"
            @update:limit="(l) => { store.setFilters({ limit: l, page: 1 }); loadItems() }"
          />
        </template>
      </VDataTableServer>
    </AppFilterBar>

    <!-- Form Drawer -->
    <ItemFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :item="editingItem"
      @submit="handleFormSubmit"
    />

    <!-- Delete Confirm Dialog -->
    <AppConfirmDialog
      v-model="isDeleteDialogVisible"
      title="Xác nhận xóa"
      confirm-text="Xóa"
      :loading="isLoading"
      @confirm="handleDeleteConfirm"
    >
      <template v-if="deletingId !== null">
        Bạn có chắc chắn muốn xóa công việc này? Hành động này không thể hoàn tác.
      </template>
      <template v-else>
        Bạn có chắc chắn muốn xóa <strong>{{ selected.length }} công việc</strong> đã chọn?
      </template>
    </AppConfirmDialog>

    <!-- General Confirm Dialog -->
    <AppConfirmDialog
      v-model="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      @confirm="() => { confirmDialog.onConfirm(); confirmDialog.show = false }"
    />

    <!-- Import Dialog -->
    <AppImportDialog
      v-model="isImportDialogVisible"
      title="Nhập danh sách công việc"
      description="Hỗ trợ tệp Excel hoặc CSV."
      column-hint="Cột bắt buộc: task_assignment_document_id, name, deadline_type. Cột tùy chọn: description, start_at, end_at, processing_status, priority, completion_percent."
      :downloading-template="isDownloadingTemplate"
      :loading="isImporting"
      @import="handleImport"
      @download-template="handleDownloadTemplate"
    />

    <!-- Export Dialog -->
    <AppExportDialog
      v-model="isExportDialogVisible"
      title="Xuất dữ liệu công việc"
      :loading="isExporting"
      @export="handleExport"
    />

    <!-- Snackbar -->
    <AppSnackbar
      v-model="snackbar.show"
      :message="snackbar.message"
      :color="snackbar.color"
    />
  </section>
</template>

<style scoped>
:deep(.v-data-table__tr) {
  height: 64px;
}

.task-filter-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  width: 100%;
}

.task-filter-grid > div {
  min-width: 0;
}

@media (min-width: 600px) {
  .task-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .task-filter-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .task-filter-grid {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }
}
</style>
