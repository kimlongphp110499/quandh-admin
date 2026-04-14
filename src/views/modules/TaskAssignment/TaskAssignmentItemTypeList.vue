<!-- eslint-disable import/extensions -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import TaskAssignmentItemTypeFormDrawer from './TaskAssignmentItemTypeFormDrawer.vue'
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
// eslint-disable-next-line import/no-unresolved
import { useTaskAssignmentItemTypeStore } from '@/store/modules/task-assignment-item-type'

import type { TaskAssignmentItemType } from '@/api/modules/task-assignment-item-type'

const store = useTaskAssignmentItemTypeStore()

const isFormDrawerVisible = ref(false)
const editingItemType = ref<TaskAssignmentItemType | null>(null)
const selected = ref<TaskAssignmentItemType[]>([])
const isImportDialogVisible = ref(false)
const isExportDialogVisible = ref(false)
const isImporting = ref(false)
const isExporting = ref(false)
const isDownloadingTemplate = ref(false)
const importErrors = ref<{ row: number; errors: string[] }[]>([])

const searchQuery = ref('')
const statusFilter = ref<string | null>(null)
const fromDate = ref('')
const toDate = ref('')

const isDeleteDialogVisible = ref(false)
const deletingId = ref<number | null>(null)

const isStatusToggleDialogVisible = ref(false)
const statusToggleItem = ref<TaskAssignmentItemType | null>(null)

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
const selectedIds = computed(() => selected.value.map(t => t.id))
const indexOffset = computed(() => ((store.filters.page ?? 1) - 1) * (store.filters.limit ?? 15))

const headers = [
  { title: '', key: 'data-table-select', sortable: false },
  { title: 'STT', key: 'index', sortable: false, align: 'center' as const, width: '60px', minWidth: '60px' },
  { title: 'Tên loại công việc', key: 'name', sortable: true, align: 'start' as const, minWidth: '240px' },
  { title: 'Trạng thái', key: 'status', sortable: true, align: 'start' as const, width: '120px', minWidth: '120px' },
  { title: 'Ngày tạo', key: 'created_at', sortable: true, align: 'start' as const, width: '160px', minWidth: '160px' },
  { title: 'Ngày cập nhật', key: 'updated_at', sortable: true, align: 'start' as const, width: '160px', minWidth: '160px' },
  { title: 'Hành động', key: 'actions', sortable: false, align: 'start' as const, width: '120px', minWidth: '160px' },
]

const statusOptions = [
  { title: 'Hoạt động', value: 'active' },
  { title: 'Không hoạt động', value: 'inactive' },
]

const resolveStatusLabel = (status: string) => status === 'active' ? 'Hoạt động' : 'Không hoạt động'

const loadItemTypes = async () => {
  await store.fetchItemTypes({
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
  const newSortBy = sortBy?.key as any || 'created_at'
  const newSortOrder = sortBy?.order || 'desc'

  if (newSortBy !== store.filters.sort_by || newSortOrder !== store.filters.sort_order) {
    store.setFilters({ sort_by: newSortBy, sort_order: newSortOrder })
    loadItemTypes()
  }
}

const openCreateDrawer = () => {
  editingItemType.value = null
  isFormDrawerVisible.value = true
}

const openEditDrawer = (itemType: TaskAssignmentItemType) => {
  editingItemType.value = itemType
  isFormDrawerVisible.value = true
}

const handleFormSubmit = async () => {
  isFormDrawerVisible.value = false
  await Promise.all([loadItemTypes(), store.fetchStats()])
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
      await store.deleteItemType(deletingId.value)
      showToast('Xóa loại công việc thành công!', 'success')
    }
    else {
      await store.bulkDelete(selectedIds.value)
      showToast(`Đã xóa ${selectedIds.value.length} loại công việc!`, 'success')
      selected.value = []
    }
    isDeleteDialogVisible.value = false
    await Promise.all([loadItemTypes(), store.fetchStats()])
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Xóa thất bại!'), 'error')
    isDeleteDialogVisible.value = false
  }
}

const statusToggleLoadingId = ref<number | null>(null)

const handleToggleStatus = (itemType: TaskAssignmentItemType) => {
  if (isStatusToggleDialogVisible.value)
    return
  statusToggleItem.value = itemType
  isStatusToggleDialogVisible.value = true
}

const handleStatusToggleConfirm = async () => {
  if (!statusToggleItem.value)
    return

  statusToggleLoadingId.value = statusToggleItem.value.id

  try {
    const newStatus = statusToggleItem.value.status === 'active' ? 'inactive' : 'active'

    await store.changeStatus(statusToggleItem.value.id, newStatus)
    showToast('Cập nhật trạng thái thành công!', 'success')
    await Promise.all([loadItemTypes(), store.fetchStats()])
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
    `Bạn có chắc muốn ${label} ${selectedIds.value.length} loại công việc đã chọn?`,
    async () => {
      try {
        await store.bulkUpdateStatus(selectedIds.value, status)
        selected.value = []
        showToast('Cập nhật trạng thái thành công!', 'success')
        await Promise.all([loadItemTypes(), store.fetchStats()])
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
    await store.exportItemTypes(
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
    const result = await store.importItemTypes(file)
    if (result?.errors?.length) {
      importErrors.value = result.errors
      if (result.imported > 0) {
        showToast(`Đã nhập ${result.imported} dòng. Một số dòng bị lỗi, vui lòng kiểm tra.`, 'error')
        await Promise.all([loadItemTypes(), store.fetchStats()])
      }
    }
    else {
      showToast('Nhập dữ liệu thành công!', 'success')
      isImportDialogVisible.value = false
      await Promise.all([loadItemTypes(), store.fetchStats()])
    }
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
    loadItemTypes()
  }, 400)
})

watch([statusFilter, fromDate, toDate], () => {
  store.setFilters({ page: 1 })
  loadItemTypes()
})

onMounted(async () => {
  await Promise.all([store.fetchStats(), loadItemTypes()])
})
</script>

<template>
  <section>
    <!-- System Page Header -->
    <AppSystemPageHeader
      title="Loại công việc"
      :total="store.stats?.total ?? 0"
      :active="store.stats?.active ?? 0"
      :inactive="store.stats?.inactive ?? 0"
      total-label="Tổng loại công việc"
      active-label="Đang hoạt động"
      inactive-label="Không hoạt động"
      total-icon="tabler-list"
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
            placeholder="Tên loại công việc..."
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
        :items="store.itemTypes"
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

        <!-- Tên loại công việc -->
        <template #item.name="{ item }">
          <div class="d-flex flex-column py-2">
            <span class="font-weight-medium">{{ item.name }}</span>
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

          <VBtn
            icon
            variant="text"
            color="medium-emphasis"
          >
            <VIcon icon="tabler-dots-vertical" />
            <VMenu activator="parent">
              <VList>
                <VListItem @click="openEditDrawer(item)">
                  <template #prepend>
                    <VIcon icon="tabler-edit" />
                  </template>
                  <VListItemTitle>Sửa</VListItemTitle>
                </VListItem>

                <VListItem @click="handleToggleStatus(item)">
                  <template #prepend>
                    <VIcon :icon="item.status === 'active' ? 'tabler-toggle-right' : 'tabler-toggle-left'" />
                  </template>
                  <VListItemTitle>
                    {{ item.status === 'active' ? 'Tắt hoạt động' : 'Bật hoạt động' }}
                  </VListItemTitle>
                </VListItem>

                <VListItem @click="confirmDeleteSingle(item.id)">
                  <template #prepend>
                    <VIcon icon="tabler-trash" />
                  </template>
                  <VListItemTitle>Xóa</VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>
          </VBtn>
        </template>

        <!-- No Data -->
        <template #no-data>
          <div class="text-center py-8">
            <VIcon
              icon="tabler-list-off"
              size="48"
              color="disabled"
              class="mb-4"
            />
            <div class="text-sm text-disabled">
              Không có loại công việc nào
            </div>
          </div>
        </template>

        <template #bottom>
          <AppPagination
            :page="store.filters.page || 1"
            :limit="store.filters.limit || 15"
            :total="store.total"
            :limit-options="[10, 15, 20, 50, 100]"
            :loading="isLoading"
            @update:page="(p) => { store.setFilters({ page: p }); loadItemTypes() }"
            @update:limit="(l) => { store.setFilters({ limit: l, page: 1 }); loadItemTypes() }"
          />
        </template>
      </VDataTableServer>
    </AppFilterBar>

    <!-- Form Drawer -->
    <TaskAssignmentItemTypeFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :item-type="editingItemType"
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
        Bạn có chắc chắn muốn xóa loại công việc này? Hành động này không thể hoàn tác.
      </template>
      <template v-else>
        Bạn có chắc chắn muốn xóa <strong>{{ selected.length }} loại công việc</strong> đã chọn?
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
        từ <strong>{{ resolveStatusLabel(statusToggleItem.status) }}</strong>
        sang <strong>{{ resolveStatusLabel(statusToggleItem.status === 'active' ? 'inactive' : 'active') }}</strong>?
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
      title="Nhập danh sách loại công việc"
      description="Hỗ trợ tệp Excel hoặc CSV theo mẫu. Bạn có thể tải file mẫu trước khi nhập."
      column-hint="Cột bắt buộc: name. Cột tùy chọn: description, status (active/inactive)."
      :loading="isImporting"
      :downloading-template="isDownloadingTemplate"
      :import-errors="importErrors"
      @import="handleImport"
      @download-template="handleDownloadTemplate"
    />

    <!-- Export Dialog -->
    <AppExportDialog
      v-model="isExportDialogVisible"
      title="Xuất dữ liệu loại công việc"
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
