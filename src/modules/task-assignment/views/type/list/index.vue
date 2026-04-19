<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import TypeFormDrawer from '../../../components/TypeFormDrawer.vue'
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
import { useTypeStore } from '../../../stores/useTypeStore'
import { typeApi } from '../../../services/typeApi'
import type { Type } from '../../../services/typeApi'
import { TYPE_TABLE_HEADERS, TYPE_STATUS_OPTIONS, TYPE_LIMIT_OPTIONS } from '../../../configs/typeOptions'

const store = useTypeStore()

const isFormDrawerVisible = ref(false)
const editingType = ref<Type | null>(null)
const selected = ref<Type[]>([])
const isImportDialogVisible = ref(false)
const isExportDialogVisible = ref(false)
const isImporting = ref(false)
const isExporting = ref(false)

const searchQuery = ref('')
const statusFilter = ref<string | null>(null)

const isDeleteDialogVisible = ref(false)
const deletingId = ref<number | null>(null)

const isStatusToggleDialogVisible = ref(false)
const statusToggleItem = ref<Type | null>(null)
const statusToggleLoadingId = ref<number | null>(null)

const confirmDialog = ref({ show: false, title: '', message: '', onConfirm: () => {} })
const snackbar = ref({ show: false, message: '', color: 'success' })
const isDownloadingTemplate = ref(false)

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  confirmDialog.value = { show: true, title, message, onConfirm }
}

const hasActiveFilters = computed(() => !!searchQuery.value || !!statusFilter.value)
const isLoading = computed(() => store.isLoading)
const selectedIds = computed(() => selected.value.map(t => t.id))
const indexOffset = computed(() => ((store.filters.page ?? 1) - 1) * (store.filters.limit ?? 15))

const headers = TYPE_TABLE_HEADERS

const statusOptions = TYPE_STATUS_OPTIONS

const resolveStatusLabel = (status: string) => status === 'active' ? 'Hoạt động' : 'Không hoạt động'

const loadTypes = async () => {
  await store.fetchTypes({
    page: store.filters.page,
    limit: store.filters.limit,
    search: searchQuery.value || undefined,
    status: statusFilter.value || undefined,
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
    loadTypes()
  }
}

const openCreateDrawer = () => {
  editingType.value = null
  isFormDrawerVisible.value = true
}

const openEditDrawer = (type: Type) => {
  editingType.value = type
  isFormDrawerVisible.value = true
}

const handleFormSubmit = async () => {
  isFormDrawerVisible.value = false
  await Promise.all([loadTypes(), store.fetchStats()])
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
      await store.deleteType(deletingId.value)
      showToast('Xóa loại văn bản thành công!', 'success')
    }
    else {
      await store.bulkDelete(selectedIds.value)
      showToast(`Đã xóa ${selectedIds.value.length} loại văn bản!`, 'success')
      selected.value = []
    }
    isDeleteDialogVisible.value = false
    await Promise.all([loadTypes(), store.fetchStats()])
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Xóa thất bại!'), 'error')
    isDeleteDialogVisible.value = false
  }
}

const handleToggleStatus = (type: Type) => {
  if (isStatusToggleDialogVisible.value)
    return
  statusToggleItem.value = type
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
    await Promise.all([loadTypes(), store.fetchStats()])
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
    `Bạn có chắc muốn ${label} ${selectedIds.value.length} loại văn bản đã chọn?`,
    async () => {
      try {
        await store.bulkUpdateStatus(selectedIds.value, status)
        selected.value = []
        showToast('Cập nhật trạng thái thành công!', 'success')
        await Promise.all([loadTypes(), store.fetchStats()])
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
    await store.exportTypes(
      scope === 'all'
        ? undefined
        : {
            search: searchQuery.value || undefined,
            status: statusFilter.value || undefined,
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
  try {
    await store.importTypes(file)
    showToast('Nhập dữ liệu thành công!', 'success')
    isImportDialogVisible.value = false
    await Promise.all([loadTypes(), store.fetchStats()])
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
    console.log(122)
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
    loadTypes()
  }, 400)
})

watch(statusFilter, () => {
  store.setFilters({ page: 1 })
  loadTypes()
})

onMounted(async () => {
  await Promise.all([store.fetchStats(), loadTypes()])

  // Mở form chỉnh sửa nếu được yêu cầu từ trang khác (TypePreviewDialog)
  if (store.pendingEditId) {
    const id = store.pendingEditId
    store.pendingEditId = null
    try {
      const res = await typeApi.show(id)
      if (res.data.success && res.data.data)
        openEditDrawer(res.data.data)
    }
    catch { /* silent */ }
  }
})
</script>

<template>
  <section>
    <!-- System Page Header -->
    <AppSystemPageHeader
      title="Loại văn bản"
      :total="store.stats?.total ?? 0"
      :active="store.stats?.active ?? 0"
      :inactive="store.stats?.inactive ?? 0"
      total-label="Tổng loại văn bản"
      active-label="Đang hoạt động"
      inactive-label="Không hoạt động"
      total-icon="tabler-file-description"
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
            placeholder="Tên loại văn bản..."
            prepend-inner-icon="tabler-search"
            clearable
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
            prepend-icon="tabler-circle-check"
            @click="handleBulkStatus('active')"
          >
            <span class="d-none d-sm-inline">Hoạt động</span>
            ({{ selectedIds.length }})
          </VBtn>
          <VBtn
            variant="tonal"
            color="warning"
            prepend-icon="tabler-circle-x"
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
        :items="store.types"
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

        <!-- Tên loại văn bản -->
        <template #item.name="{ item }">
          <span class="text-base font-weight-medium text-high-emphasis">{{ item.name }}</span>
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
              icon="tabler-file-description-off"
              size="48"
              color="disabled"
              class="mb-4"
            />
            <div class="text-sm text-disabled">
              Không có loại văn bản nào
            </div>
          </div>
        </template>

        <template #bottom>
          <AppPagination
            :page="store.filters.page || 1"
            :limit="store.filters.limit || 15"
            :total="store.total"
            :limit-options="TYPE_LIMIT_OPTIONS"
            :loading="isLoading"
            @update:page="(p) => { store.setFilters({ page: p }); loadTypes() }"
            @update:limit="(l) => { store.setFilters({ limit: l, page: 1 }); loadTypes() }"
          />
        </template>
      </VDataTableServer>
    </AppFilterBar>

    <!-- Form Drawer -->
    <TypeFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :type="editingType"
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
        Bạn có chắc chắn muốn xóa loại văn bản này? Hành động này không thể hoàn tác.
      </template>
      <template v-else>
        Bạn có chắc chắn muốn xóa <strong>{{ selected.length }} loại văn bản</strong> đã chọn?
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
      title="Nhập danh sách loại văn bản"
      description="Hỗ trợ tệp Excel hoặc CSV. Cột bắt buộc: Tên loại văn bản."
      column-hint="Cột bắt buộc: Tên loại văn bản (*). Cột tùy chọn: Mô tả, Trạng thái (active/inactive)."
      :has-template="true"
      :loading="isImporting"
      :downloading-template="isDownloadingTemplate"
      :import-errors="importErrors"
      @import="handleImport"
      @download-template="handleDownloadTemplate"
    />

    <!-- Export Dialog -->
    <AppExportDialog
      v-model="isExportDialogVisible"
      title="Xuất dữ liệu loại văn bản"
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
