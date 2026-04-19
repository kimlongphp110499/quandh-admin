<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import DepartmentFormDrawer from '../../../components/DepartmentFormDrawer.vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { getErrorMessage } from '@/utils/errorMessage'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSystemPageHeader from '@/components/AppSystemPageHeader.vue'
// eslint-disable-next-line import/no-unresolved
import AppUserDateInfo from '@/components/AppUserDateInfo.vue'
// eslint-disable-next-line import/no-unresolved
import AppImportDialog from '@/components/AppImportDialog.vue'
import AppExportDialog from '@/components/AppExportDialog.vue'
import { useDepartmentStore } from '../../../stores/useDepartmentStore'
import type { Department } from '../../../services/departmentApi'
import { DEPARTMENT_TABLE_HEADERS, DEPARTMENT_STATUS_OPTIONS, DEPARTMENT_LIMIT_OPTIONS } from '../../../configs/departmentOptions'
import {
  resolveDepartmentStatusLabel,
  resolveToggleStatusLabel,
  resolveToggleStatusIcon,
  toggleDepartmentStatus,
} from '../../../utils/departmentAdapters'

const store = useDepartmentStore()

const isFormDrawerVisible = ref(false)
const editingDepartment = ref<Department | null>(null)
const selected = ref<Department[]>([])
const isImportDialogVisible = ref(false)
const isExportDialogVisible = ref(false)
const isImporting = ref(false)
const importErrors = ref<{ row: number, errors: string[] }[]>([])
const isExporting = ref(false)
const isDownloadingTemplate = ref(false)

const searchQuery = ref('')
const statusFilter = ref<string | null>(null)
const fromDate = ref('')
const toDate = ref('')

// Delete dialog
const isDeleteDialogVisible = ref(false)
const deletingId = ref<number | null>(null)

// Status toggle confirmation dialog
const isStatusToggleDialogVisible = ref(false)
const statusToggleItem = ref<Department | null>(null)

const snackbar = ref({ show: false, message: '', color: 'success' })
const confirmDialog = ref({ show: false, title: '', message: '', onConfirm: () => {}, loading: false })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  confirmDialog.value = { show: true, title, message, onConfirm, loading: false }
}

const hasActiveFilters = computed(() => !!searchQuery.value || !!statusFilter.value || !!fromDate.value || !!toDate.value)
const isLoading = computed(() => store.isLoading)
const selectedIds = computed(() => selected.value.map(d => d.id))
const indexOffset = computed(() => ((store.filters.page ?? 1) - 1) * (store.filters.limit ?? 15))

const headers = DEPARTMENT_TABLE_HEADERS
const statusOptions = DEPARTMENT_STATUS_OPTIONS

const loadDepartments = async () => {
  await store.fetchDepartments({
    page: store.filters.page,
    limit: store.filters.limit,
    search: searchQuery.value || undefined,
    status: statusFilter.value || undefined,
    from_date: fromDate.value || undefined,
    to_date: toDate.value || undefined,
    sort_by: store.filters.sort_by,
    sort_order: store.filters.sort_order,
  })
}

const handleTableUpdate = (options: any) => {
  const sortBy = options.sortBy?.[0]
  const newSortBy = sortBy?.key as any || 'sort_order'
  const newSortOrder = sortBy?.order || 'asc'

  if (newSortBy !== store.filters.sort_by || newSortOrder !== store.filters.sort_order) {
    store.setFilters({ sort_by: newSortBy, sort_order: newSortOrder })
    loadDepartments()
  }
}

const openCreateDrawer = () => {
  editingDepartment.value = null
  isFormDrawerVisible.value = true
}

const openEditDrawer = (department: Department) => {
  editingDepartment.value = department
  isFormDrawerVisible.value = true
}

const handleFormSubmit = async () => {
  isFormDrawerVisible.value = false
  await Promise.all([loadDepartments(), store.fetchStats()])
}

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
      await store.deleteDepartment(deletingId.value)
      showToast('Xóa phòng ban thành công!', 'success')
    }
    else {
      await store.bulkDelete(selectedIds.value)
      showToast(`Đã xóa ${selectedIds.value.length} phòng ban!`, 'success')
      selected.value = []
    }
    isDeleteDialogVisible.value = false
    await Promise.all([loadDepartments(), store.fetchStats()])
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Xóa thất bại!'), 'error')
    isDeleteDialogVisible.value = false
  }
}

const statusToggleLoadingId = ref<number | null>(null)

const handleToggleStatus = (department: Department) => {
  if (isStatusToggleDialogVisible.value)
    return
  statusToggleItem.value = department
  isStatusToggleDialogVisible.value = true
}

const handleStatusToggleConfirm = async () => {
  if (!statusToggleItem.value)
    return

  statusToggleLoadingId.value = statusToggleItem.value.id

  try {
    const newStatus = toggleDepartmentStatus(statusToggleItem.value.status)

    await store.changeStatus(statusToggleItem.value.id, newStatus)
    showToast('Cập nhật trạng thái thành công!', 'success')
    await Promise.all([loadDepartments(), store.fetchStats()])
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Cập nhật trạng thái thất bại!'), 'error')
  }
  finally {
    statusToggleLoadingId.value = null
    isStatusToggleDialogVisible.value = false
    statusToggleItem.value = null
  }
}

const handleBulkStatus = (status: 'active' | 'inactive') => {
  if (!selectedIds.value.length)
    return

  const label = status === 'active' ? 'hoạt động' : 'không hoạt động'

  showConfirm(
    'Cập nhật trạng thái hàng loạt',
    `Bạn có chắc muốn ${label} ${selectedIds.value.length} phòng ban đã chọn?`,
    async () => {
      try {
        await store.bulkUpdateStatus(selectedIds.value, status)
        selected.value = []
        showToast('Cập nhật trạng thái thành công!', 'success')
        await Promise.all([loadDepartments(), store.fetchStats()])
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
    await store.exportDepartments(
      scope === 'all'
        ? undefined
        : {
            search: searchQuery.value || undefined,
            status: statusFilter.value || undefined,
            from_date: fromDate.value || undefined,
            to_date: toDate.value || undefined,
          },
    )
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
  importErrors.value = []
  try {
    await store.importDepartments(file)
    showToast('Nhập dữ liệu thành công!', 'success')
    isImportDialogVisible.value = false
    await Promise.all([loadDepartments(), store.fetchStats()])
  }
  catch (err: any) {
    showToast('Nhập dữ liệu thất bại!', 'error')
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
    loadDepartments()
  }, 400)
})

watch([statusFilter, fromDate, toDate], () => {
  store.setFilters({ page: 1 })
  loadDepartments()
})

onMounted(async () => {
  await Promise.all([store.fetchStats(), loadDepartments()])
})
</script>

<template>
  <section>
    <!-- System Page Header -->
    <AppSystemPageHeader
      title="Phòng ban"
      :total="store.stats?.total ?? 0"
      :active="store.stats?.active ?? 0"
      :inactive="store.stats?.inactive ?? 0"
      total-label="Tổng phòng ban"
      active-label="Đang hoạt động"
      inactive-label="Không hoạt động"
      total-icon="tabler-building-warehouse"
      active-icon="tabler-circle-check"
      inactive-icon="tabler-circle-x"
      @settings="() => {}"
    />

    <!-- Filter & Actions Bar -->
    <AppFilterBar :has-active-filters="hasActiveFilters">
      <template #filters>
        <VCol
          cols="12"
          sm="6"
          md="6"
        >
          <AppTextField
            v-model="searchQuery"
            placeholder="Tên hoặc mã phòng ban..."
            prepend-inner-icon="tabler-search"
            hide-details
          />
        </VCol>
        <VCol
          cols="12"
          sm="6"
          md="6"
        >
          <AppSelect
            v-model="statusFilter"
            placeholder="Chọn trạng thái"
            :items="statusOptions"
            clearable
            clear-icon="tabler-x"
            hide-details
          />
        </VCol>
      </template>

      <template #actions>
        <!-- Bulk actions -->
        <template v-if="selectedIds.length > 0">
          <VBtn
            variant="tonal"
            color="success"
            prepend-icon="tabler-user-check"
            @click="handleBulkStatus('active')"
          >
            <span class="d-none d-sm-inline">Hoạt động</span>
            ({{ selectedIds.length }})
          </VBtn>
          <VBtn
            variant="tonal"
            color="warning"
            prepend-icon="tabler-user-off"
            @click="handleBulkStatus('inactive')"
          >
            <span class="d-none d-sm-inline">Không hoạt động</span>
            ({{ selectedIds.length }})
          </VBtn>
          <VBtn
            variant="tonal"
            color="error"
            prepend-icon="tabler-trash"
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
        :items="store.departments"
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
          <span class="text-body-1 text-high-emphasis">{{ indexOffset + index + 1 }}</span>
        </template>

        <!-- Mã phòng ban -->
        <template #item.code="{ item }">
          <span class="text-base font-weight-medium text-high-emphasis">{{ item.code }}</span>
        </template>

        <!-- Tên phòng ban -->
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-2">
            <span class="text-base font-weight-medium text-high-emphasis">{{ item.name }}</span>
          </div>
        </template>

        <!-- Trạng thái -->
        <template #item.status="{ item }">
          <div
            class="d-inline-flex"
            @click.stop="handleToggleStatus(item)"
          >
            <VSwitch
              :model-value="item.status === 'active'"
              inset
              hide-details
              density="compact"
              readonly
              :loading="statusToggleLoadingId === item.id"
            />
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

        <!-- Ngày cập nhật -->
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
            <VIcon icon="tabler-edit" />
          </IconBtn>

          <IconBtn
            color="error"
            @click="confirmDeleteSingle(item.id)"
          >
            <VIcon icon="tabler-trash" />
          </IconBtn>
        </template>

        <!-- No Data -->
        <template #no-data>
          <div class="text-center py-8">
            <VIcon
              icon="tabler-building-warehouse-off"
              size="48"
              color="disabled"
              class="mb-4"
            />
            <div class="text-sm text-disabled">
              Không có phòng ban nào
            </div>
          </div>
        </template>

        <template #bottom>
          <AppPagination
            :page="store.filters.page || 1"
            :limit="store.filters.limit || 15"
            :total="store.total"
            :limit-options="DEPARTMENT_LIMIT_OPTIONS"
            :loading="isLoading"
            @update:page="(p) => { store.setFilters({ page: p }); loadDepartments() }"
            @update:limit="(l) => { store.setFilters({ limit: l, page: 1 }); loadDepartments() }"
          />
        </template>
      </VDataTableServer>
    </AppFilterBar>

    <!-- Form Drawer -->
    <DepartmentFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :department="editingDepartment"
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
        Bạn có chắc chắn muốn xóa phòng ban này? Hành động này không thể hoàn tác.
      </template>
      <template v-else>
        Bạn có chắc chắn muốn xóa <strong>{{ selected.length }} phòng ban</strong> đã chọn?
      </template>
    </AppConfirmDialog>

    <!-- Status Toggle Confirm Dialog -->
    <AppConfirmDialog
      v-model="isStatusToggleDialogVisible"
      title="Xác nhận thay đổi trạng thái"
      confirm-text="Thay đổi"
      :loading="isLoading"
      @confirm="handleStatusToggleConfirm"
    >
      <template v-if="statusToggleItem">
        Bạn có chắc chắn muốn thay đổi trạng thái của <strong>{{ statusToggleItem.name }}</strong>
        từ <strong>{{ resolveDepartmentStatusLabel(statusToggleItem.status) }}</strong>
        sang <strong>{{ resolveDepartmentStatusLabel(toggleDepartmentStatus(statusToggleItem.status)) }}</strong>?
      </template>
    </AppConfirmDialog>

    <!-- Bulk / general Confirm Dialog -->
    <AppConfirmDialog
      v-model="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      @confirm="() => { confirmDialog.onConfirm(); confirmDialog.show = false }"
    />

    <!-- Import Dialog -->
    <AppImportDialog
      v-model="isImportDialogVisible"
      title="Nhập danh sách phòng ban"
      description="Hỗ trợ tệp Excel hoặc CSV theo mẫu Core API. Bạn có thể tải file mẫu trước khi nhập."
      column-hint="Cột bắt buộc: code, name. Cột tùy chọn: description, status (active/inactive), sort_order."
      :loading="isImporting"
      :downloading-template="isDownloadingTemplate"
      :import-errors="importErrors"
      @import="handleImport"
      @download-template="handleDownloadTemplate"
    />

    <!-- Export Dialog -->
    <AppExportDialog
      v-model="isExportDialogVisible"
      title="Xuất dữ liệu phòng ban"
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
</style>
