<!-- eslint-disable import/no-unresolved -->
<!-- eslint-disable import/extensions -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import DocumentFormDrawer from '../../../components/document/DocumentFormDrawer.vue'
import DocumentAttachmentDialog from '../../../components/document/DocumentAttachmentDialog.vue'
import { useTypeStore } from '../../../stores/useTypeStore'
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
import { useDocumentStore } from '../../../stores/useDocumentStore'
import type { Document } from '../../../services/documentApi'
import { typeApi } from '../../../services/typeApi'
import { DOCUMENT_TABLE_HEADERS, DOCUMENT_STATUS_OPTIONS, DOCUMENT_LIMIT_OPTIONS } from '../../../configs/documentOptions'

const router = useRouter()
const store = useDocumentStore()

const isFormDrawerVisible = ref(false)
const editingDocument = ref<Document | null>(null)
const isAttachmentDialogVisible = ref(false)

const typeStore = useTypeStore()

const goToTypeEdit = (typeId: number) => {
  typeStore.pendingEditId = typeId
  router.push({ path: '/task-assignment/types' })
}

const attachmentDocument = ref<Document | null>(null)

const openAttachmentDialog = (doc: Document) => {
  attachmentDocument.value = doc
  isAttachmentDialogVisible.value = true
}

const selected = ref<Document[]>([])
const isImportDialogVisible = ref(false)
const isExportDialogVisible = ref(false)
const isImporting = ref(false)
const isExporting = ref(false)

const searchQuery = ref('')
const statusFilter = ref<string | null>(null)

// --- Bộ lọc loại văn bản (infinity scroll) ---
const typeIdFilter = ref<number | null>(null)
const typeFilterOptions = ref<{ title: string; value: number }[]>([])
const typeFilterPage = ref(1)
const typeFilterTotal = ref(0)
const typeFilterLoading = ref(false)
const typeFilterHasMore = computed(() => typeFilterOptions.value.length < typeFilterTotal.value)

const loadTypeFilterOptions = async (reset = false) => {
  if (typeFilterLoading.value)
    return
  if (reset) {
    typeFilterPage.value = 1
    typeFilterOptions.value = []
  }
  typeFilterLoading.value = true
  try {
    const res = await typeApi.list({ page: typeFilterPage.value, limit: 20, status: 'active' })
    if (res.data.success) {
      const items = (res.data.data || []).map((t: any) => ({ title: t.name, value: t.id }))

      typeFilterOptions.value = reset ? items : [...typeFilterOptions.value, ...items]
      typeFilterTotal.value = res.data.meta?.total || 0
      typeFilterPage.value++
    }
  }
  catch { /* silent */ }
  finally { typeFilterLoading.value = false }
}

const onTypeFilterIntersect = (isIntersecting: boolean) => {
  if (isIntersecting && typeFilterHasMore.value && !typeFilterLoading.value)
    loadTypeFilterOptions()
}

// --- Bộ lọc ngày ban hành (range picker 1 ô) ---
const issueDateRange = ref('')

// Parse chuỗi range "dd/mm/yyyy to dd/mm/yyyy" → { from_issue_date, to_issue_date }
const parseIssueDateRange = (range: string) => {
  const parts = range?.split(' to ')

  return {
    from_issue_date: normalizeDate(parts?.[0]?.trim()),
    to_issue_date: normalizeDate(parts?.[1]?.trim()),
  }
}

const isDeleteDialogVisible = ref(false)
const deletingId = ref<number | null>(null)

const isStatusToggleDialogVisible = ref(false)
const statusToggleItem = ref<Document | null>(null)
const statusToggleLoadingId = ref<number | null>(null)

const confirmDialog = ref({ show: false, title: '', message: '', onConfirm: () => {} })
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  confirmDialog.value = { show: true, title, message, onConfirm }
}

const hasActiveFilters = computed(() =>
  !!searchQuery.value || !!statusFilter.value || !!typeIdFilter.value || !!issueDateRange.value,
)

const isDownloadingTemplate = ref(false)

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

const isLoading = computed(() => store.isLoading)
const selectedIds = computed(() => selected.value.map(d => d.id))
const indexOffset = computed(() => ((store.filters.page ?? 1) - 1) * (store.filters.limit ?? 15))

const headers = DOCUMENT_TABLE_HEADERS

const statusOptions = DOCUMENT_STATUS_OPTIONS

const resolveStatusLabel = (status: string) => status === 'issued' ? 'Ban hành' : 'Bản nháp'

const loadDocuments = async () => {
  const issueDates = parseIssueDateRange(issueDateRange.value)

  await store.fetchDocuments({
    page: store.filters.page,
    limit: store.filters.limit,
    search: searchQuery.value || undefined,
    status: statusFilter.value || undefined,
    task_assignment_type_id: typeIdFilter.value || undefined,
    from_issue_date: issueDates.from_issue_date,
    to_issue_date: issueDates.to_issue_date,
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
    loadDocuments()
  }
}

const openCreateDrawer = () => {
  editingDocument.value = null
  isFormDrawerVisible.value = true
}

const goToDetail = (doc: Document) => {
  router.push({ name: 'task-assignment-documents-id', params: { id: doc.id } })
}

const openEditDrawer = (doc: Document) => {
  editingDocument.value = doc
  isFormDrawerVisible.value = true
}

const handleFormSubmit = async () => {
  isFormDrawerVisible.value = false
  await Promise.all([loadDocuments(), store.fetchStats()])
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
      await store.deleteDocument(deletingId.value)
      showToast('Xóa văn bản giao việc thành công!', 'success')
    }
    else {
      await store.bulkDelete(selectedIds.value)
      showToast(`Đã xóa ${selectedIds.value.length} văn bản!`, 'success')
      selected.value = []
    }
    isDeleteDialogVisible.value = false
    await Promise.all([loadDocuments(), store.fetchStats()])
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Xóa thất bại!'), 'error')
    isDeleteDialogVisible.value = false
  }
}

const handleToggleStatus = (doc: Document) => {
  if (isStatusToggleDialogVisible.value)
    return
  statusToggleItem.value = doc
  isStatusToggleDialogVisible.value = true
}

const handleStatusToggleConfirm = async () => {
  if (!statusToggleItem.value)
    return

  statusToggleLoadingId.value = statusToggleItem.value.id

  try {
    const newStatus = statusToggleItem.value.status === 'issued' ? 'draft' : 'issued'

    await store.changeStatus(statusToggleItem.value.id, newStatus)
    showToast('Cập nhật trạng thái thành công!', 'success')
    await Promise.all([loadDocuments(), store.fetchStats()])
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

const handleBulkStatus = (status: 'draft' | 'issued') => {
  if (!selectedIds.value.length)
    return

  const label = status === 'issued' ? 'ban hành' : 'bản nháp'

  showConfirm(
    'Cập nhật trạng thái hàng loạt',
    `Bạn có chắc muốn chuyển ${selectedIds.value.length} văn bản sang trạng thái "${label}"?`,
    async () => {
      try {
        await store.bulkUpdateStatus(selectedIds.value, status)
        selected.value = []
        showToast('Cập nhật trạng thái thành công!', 'success')
        await Promise.all([loadDocuments(), store.fetchStats()])
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
    let exportFilters
    if (scope !== 'all') {
      exportFilters = {
        search: searchQuery.value || undefined,
        status: statusFilter.value || undefined,
      }
    }

    await store.exportDocuments(exportFilters)
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
    await store.importDocuments(file)
    showToast('Nhập dữ liệu thành công!', 'success')
    isImportDialogVisible.value = false
    await Promise.all([loadDocuments(), store.fetchStats()])
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Nhập dữ liệu thất bại!'), 'error')
  }
  finally {
    isImporting.value = false
  }
}

let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    store.setFilters({ page: 1 })
    loadDocuments()
  }, 400)
})

watch(statusFilter, () => {
  store.setFilters({ page: 1 })
  loadDocuments()
})

watch(typeIdFilter, () => {
  store.setFilters({ page: 1 })
  loadDocuments()
})

watch(issueDateRange, () => {
  store.setFilters({ page: 1 })
  loadDocuments()
})

onMounted(async () => {
  await Promise.all([store.fetchStats(), loadDocuments(), loadTypeFilterOptions(true)])
})
</script>

<template>
  <section>
    <!-- System Page Header -->
    <AppSystemPageHeader
      title="Văn bản giao việc"
      :total="store.stats?.total ?? 0"
      :active="store.stats?.issued ?? 0"
      :inactive="store.stats?.draft ?? 0"
      total-label="Tổng văn bản giao việc"
      active-label="Ban hành"
      inactive-label="Bản nháp"
      total-icon="tabler-file-text"
      active-icon="tabler-circle-check"
      inactive-icon="tabler-file-pencil"
      @settings="() => {}"
    />

    <!-- Filter & Actions Bar -->
    <AppFilterBar :has-active-filters="hasActiveFilters">
      <template #filters>
        <!-- Search -->
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <AppTextField
            v-model="searchQuery"
            placeholder="Tên văn bản..."
            prepend-inner-icon="tabler-search"
            hide-details
          />
        </VCol>

        <!-- Loại văn bản Filter -->
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <VAutocomplete
            v-model="typeIdFilter"
            placeholder="Chọn loại văn bản"
            :items="typeFilterOptions"
            item-title="title"
            item-value="value"
            clearable
            hide-details
            hide-no-data
          >
            <template #append-item>
              <div
                v-if="typeFilterHasMore || typeFilterLoading"
                v-intersect="{ handler: onTypeFilterIntersect, options: { threshold: 0.5 } }"
                class="d-flex justify-center pa-2"
              >
                <VProgressCircular
                  v-if="typeFilterLoading"
                  indeterminate
                  size="18"
                  width="2"
                />
              </div>
            </template>
          </VAutocomplete>
        </VCol>

        <!-- Ngày ban hành Filter (range) -->
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <AppDateTimePicker
            v-model="issueDateRange"
            placeholder="Từ ngày - đến ngày"
            :config="{
              mode: 'range',
              dateFormat: 'd/m/Y',
            }"
            clearable
            hide-details
          />
        </VCol>

        <!-- Status Filter -->
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <AppSelect
            v-model="statusFilter"
            placeholder="Chọn trạng thái"
            :items="statusOptions"
            clearable
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
            @click="handleBulkStatus('issued')"
          >
            <span class="d-none d-sm-inline">Ban hành</span>
            ({{ selectedIds.length }})
          </VBtn>
          <VBtn
            variant="tonal"
            color="warning"
            prepend-icon="tabler-file-pencil"
            @click="handleBulkStatus('draft')"
          >
            <span class="d-none d-sm-inline">Bản nháp</span>
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
        :items="store.documents"
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

        <!-- Tên văn bản -->
        <template #item.name="{ item }">
          <RouterLink
            :to="{ name: 'task-assignment-documents-id', params: { id: item.id } }"
            class="text-link font-weight-medium d-inline-block"
          >
            {{ item.name }}
          </RouterLink>
        </template>

        <!-- Loại văn bản -->
        <template #item.type="{ item }">
          <span
            v-if="item.type"
            class="text-base font-weight-medium cursor-pointer text-high-emphasis"
            @click.stop="goToTypeEdit(item.type.id)"
          >{{ item.type.name }}</span>
          <span
            v-else
            class="text-xs text-disabled"
          >—</span>
        </template>

        <!-- Trạng thái -->
        <template #item.status="{ item }">
          <div
            class="d-inline-flex"
            @click.stop="handleToggleStatus(item)"
          >
            <VSwitch
              :model-value="item.status === 'issued'"
              inset
              hide-details
              density="compact"
              readonly
              :loading="statusToggleLoadingId === item.id"
            />
          </div>
        </template>

        <!-- Thời điểm ban hành -->
        <template #item.issued_at="{ item }">
          <span
            v-if="item.issued_at"
            class="text-base font-weight-medium text-high-emphasis"
          >{{ item.issued_at }}</span>
          <span
            v-else
            class="text-xs text-disabled"
          >—</span>
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
                <VListItem @click="openAttachmentDialog(item)">
                  <template #prepend>
                    <VIcon icon="tabler-paperclip" />
                  </template>
                  <VListItemTitle>Tệp đính kèm</VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>
          </VBtn>
        </template>

        <!-- No Data -->
        <template #no-data>
          <div class="text-center py-8">
            <VIcon
              icon="tabler-file-text-off"
              size="48"
              color="disabled"
              class="mb-4"
            />
            <div class="text-base font-weight-medium text-high-emphasis text-disabled">
              Không có văn bản giao việc nào
            </div>
          </div>
        </template>

        <template #bottom>
          <AppPagination
            :page="store.filters.page || 1"
            :limit="store.filters.limit || 15"
            :total="store.total"
            :limit-options="DOCUMENT_LIMIT_OPTIONS"
            :loading="isLoading"
            @update:page="(p) => { store.setFilters({ page: p }); loadDocuments() }"
            @update:limit="(l) => { store.setFilters({ limit: l, page: 1 }); loadDocuments() }"
          />
        </template>
      </VDataTableServer>
    </AppFilterBar>

    <!-- Form Drawer -->
    <DocumentFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :document="editingDocument"
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
        Bạn có chắc chắn muốn xóa văn bản giao việc này? Hành động này không thể hoàn tác.
      </template>
      <template v-else>
        Bạn có chắc chắn muốn xóa <strong>{{ selected.length }} văn bản</strong> đã chọn?
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
        Bạn có chắc chắn muốn thay đổi trạng thái của
        <strong>{{ statusToggleItem.name }}</strong>
        từ <strong>{{ resolveStatusLabel(statusToggleItem.status) }}</strong>
        sang <strong>{{ resolveStatusLabel(statusToggleItem.status === 'issued' ? 'draft' : 'issued') }}</strong>?
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
      title="Nhập danh sách văn bản giao việc"
      description="Hỗ trợ tệp Excel hoặc CSV."
      column-hint="Cột bắt buộc: name (*). Cột tùy chọn: task_assignment_type_id, summary, issue_date, status (draft/issued)."
      :downloading-template="isDownloadingTemplate"
      :loading="isImporting"
      @import="handleImport"
      @download-template="handleDownloadTemplate"
    />

    <!-- Export Dialog -->
    <AppExportDialog
      v-model="isExportDialogVisible"
      title="Xuất dữ liệu văn bản giao việc"
      :loading="isExporting"
      @export="handleExport"
    />

    <!-- Attachment Dialog -->
    <DocumentAttachmentDialog
      v-model="isAttachmentDialogVisible"
      :document="attachmentDocument"
      @updated="loadDocuments"
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
