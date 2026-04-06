<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import OrganizationFormDrawer from './OrganizationFormDrawer.vue'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSystemPageHeader from '@/components/AppSystemPageHeader.vue'
import AppUserDateInfo from '@/components/AppUserDateInfo.vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useOrganizationStore } from '@/store/modules/organization'
// eslint-disable-next-line import/extensions, import/no-unresolved
import type { Organization } from '@/api/modules/organization'

const orgStore = useOrganizationStore()

// State
const searchQuery = ref('')
const selectedStatus = ref<'active' | 'inactive' | ''>('')
const isFormDrawerVisible = ref(false)
const editingOrg = ref<Organization | null>(null)
const selected = ref<Organization[]>([])

// Bulk status dialog
const isBulkStatusDialogVisible = ref(false)
const bulkStatusValue = ref<'active' | 'inactive'>('active')

// Delete dialog
const isDeleteDialogVisible = ref(false)
const deletingId = ref<number | null>(null)

// Status toggle confirmation dialog
const isStatusToggleDialogVisible = ref(false)
const statusToggleItem = ref<Organization | null>(null)

// Import
const importFileInput = ref<HTMLInputElement>()
const isImporting = ref(false)
const isExporting = ref(false)
const isDownloadingTemplate = ref(false)

const hasActiveFilters = computed(() => !!searchQuery.value || !!selectedStatus.value)

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const headers = [
  { title: '', key: 'data-table-select', sortable: false },
  { title: 'STT', key: 'index', sortable: false, align: 'center' as const },
  { title: 'Tên tổ chức', key: 'name', sortable: true, align: 'start' as const },
  { title: 'Trạng thái', key: 'status', sortable: true, align: 'start' as const },
  { title: 'Ngày tạo', key: 'created_info', sortable: false, align: 'start' as const },
  { title: 'Ngày cập nhật', key: 'updated_info', sortable: false, align: 'start' as const },
  { title: 'Thao tác', key: 'actions', sortable: false, align: 'center' as const },
]

// Computed
const organizations = computed(() => orgStore.organizations)
const total = computed(() => orgStore.total)
const isLoading = computed(() => orgStore.isLoading)
const selectedIds = computed(() => selected.value.map(o => o.id))
const indexOffset = computed(() => ((orgStore.filters.page ?? 1) - 1) * (orgStore.filters.limit ?? 10))

const statusOptions = [
  { title: 'Tất cả', value: '' },
  { title: 'Hoạt động', value: 'active' },
  { title: 'Không hoạt động', value: 'inactive' },
]

const bulkStatusOptions = [
  { title: 'Hoạt động', value: 'active' },
  { title: 'Không hoạt động', value: 'inactive' },
]

// Methods
const fetchOrganizations = async () => {
  await orgStore.fetchOrganizations({
    page: orgStore.filters.page,
    limit: orgStore.filters.limit,
    search: searchQuery.value || undefined,
    status: selectedStatus.value || undefined,
  })
}

const resolveStatusVariant = (status: string) => status === 'active' ? 'success' : 'secondary'
const resolveStatusLabel = (status: string) => status === 'active' ? 'Hoạt động' : 'Không hoạt động'

const openAddDrawer = () => {
  editingOrg.value = null
  isFormDrawerVisible.value = true
}

const openEditDrawer = (org: Organization) => {
  editingOrg.value = org
  isFormDrawerVisible.value = true
}

const handleFormSubmit = async () => {
  isFormDrawerVisible.value = false
  await Promise.all([fetchOrganizations(), orgStore.fetchStats()])
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
      await orgStore.deleteOrganization(deletingId.value)
      showToast('Xóa tổ chức thành công!', 'success')
    }
    else {
      await orgStore.bulkDelete(selectedIds.value)
      showToast(`Đã xóa ${selectedIds.value.length} tổ chức!`, 'success')
      selected.value = []
    }
    isDeleteDialogVisible.value = false
    await Promise.all([fetchOrganizations(), orgStore.fetchStats()])
  }
  catch {
    showToast('Xóa thất bại!', 'error')
    isDeleteDialogVisible.value = false
  }
}

const handleToggleStatus = async (org: Organization) => {
  statusToggleItem.value = org
  isStatusToggleDialogVisible.value = true
}

const handleStatusToggleConfirm = async () => {
  if (!statusToggleItem.value)
    return

  try {
    const newStatus = statusToggleItem.value.status === 'active' ? 'inactive' : 'active'

    await orgStore.changeStatus(statusToggleItem.value.id, newStatus)
    showToast('Cập nhật trạng thái thành công!', 'success')
    await Promise.all([fetchOrganizations(), orgStore.fetchStats()])
  }
  catch {
    showToast('Cập nhật trạng thái thất bại!', 'error')
  }
  finally {
    isStatusToggleDialogVisible.value = false
    statusToggleItem.value = null
  }
}

const openBulkStatusDialog = () => {
  if (!selectedIds.value.length)
    return
  bulkStatusValue.value = 'active'
  isBulkStatusDialogVisible.value = true
}

const handleBulkUpdateStatus = async () => {
  try {
    await orgStore.bulkUpdateStatus(selectedIds.value, bulkStatusValue.value)
    showToast(`Đã cập nhật trạng thái ${selectedIds.value.length} tổ chức!`, 'success')
    selected.value = []
    isBulkStatusDialogVisible.value = false
    await Promise.all([fetchOrganizations(), orgStore.fetchStats()])
  }
  catch {
    showToast('Cập nhật trạng thái thất bại!', 'error')
    isBulkStatusDialogVisible.value = false
  }
}

const handleExport = async () => {
  isExporting.value = true
  try {
    await orgStore.exportOrganizations({
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

const handleDownloadTemplate = async () => {
  isDownloadingTemplate.value = true
  try {
    await orgStore.downloadImportTemplate()
  }
  catch {
    showToast('Tải file mẫu thất bại!', 'error')
  }
  finally {
    isDownloadingTemplate.value = false
  }
}

const triggerImport = () => importFileInput.value?.click()

const handleImportFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  isImporting.value = true
  try {
    await orgStore.importOrganizations(file)
    showToast('Nhập dữ liệu thành công!', 'success')
    await Promise.all([fetchOrganizations(), orgStore.fetchStats()])
  }
  catch (err: any) {
    showToast(err?.response?.data?.message || 'Nhập dữ liệu thất bại!', 'error')
  }
  finally {
    isImporting.value = false
    if (importFileInput.value)
      importFileInput.value.value = ''
  }
}

let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    orgStore.setFilters({ page: 1 })
    fetchOrganizations()
  }, 400)
})

watch(selectedStatus, () => {
  orgStore.setFilters({ page: 1 })
  fetchOrganizations()
})

// Init
onMounted(() => {
  fetchOrganizations()
  orgStore.fetchStats()
})

defineExpose({
  reload: () => {
    fetchOrganizations()
    orgStore.fetchStats()
  },
})
</script>

<template>
  <section>
    <!-- System Page Header -->
    <AppSystemPageHeader
      title="Tổ chức"
      :total="orgStore.stats?.total ?? 0"
      :active="orgStore.activeCount ?? 0"
      :inactive="orgStore.inactiveCount ?? 0"
      total-label="Tổng tổ chức"
      active-label="Đang hoạt động"
      inactive-label="Không hoạt động"
      total-icon="tabler-building"
      active-icon="tabler-circle-check"
      inactive-icon="tabler-circle-x"
      @settings="() => {}"
    />

    <!-- Filter & Actions Bar -->
    <AppFilterBar :has-active-filters="hasActiveFilters">
      <template #filters>
        <!-- Search -->
        <div style="min-inline-size: 240px; flex: 1;">
          <div class="text-caption text-medium-emphasis mb-1">
            Tìm kiếm tổ chức
          </div>
          <AppTextField
            v-model="searchQuery"
            placeholder="Nhập tên tổ chức..."
            prepend-inner-icon="tabler-search"
            hide-details
          />
        </div>

        <!-- Status Filter -->
        <div style="min-inline-size: 160px;">
          <div class="text-caption text-medium-emphasis mb-1">
            Trạng thái
          </div>
          <AppSelect
            v-model="selectedStatus"
            placeholder="Chọn trạng thái"
            :items="statusOptions"
            clearable
            hide-details
          />
        </div>
      </template>

      <template #actions>
        <!-- Bulk actions -->
        <template v-if="selected.length > 0">
          <VBtn
            color="error"
            variant="tonal"
            prepend-icon="tabler-trash"
            @click="confirmBulkDelete"
          >
            <span class="d-none d-sm-inline">Xóa</span>
            ({{ selected.length }})
          </VBtn>
          <VBtn
            color="warning"
            variant="tonal"
            @click="openBulkStatusDialog"
          >
            <VIcon icon="tabler-refresh" />
            <span class="d-none d-sm-inline ms-1">Cập nhật trạng thái</span>
          </VBtn>
        </template>
        <!-- Import -->
        <VBtn
          color="secondary"
          variant="tonal"
          :loading="isImporting"
          @click="triggerImport"
        >
          <VIcon icon="tabler-upload" />
          <span class="d-none d-sm-inline ms-1">Nhập</span>
        </VBtn>
        <!-- Download template -->
        <VBtn
          color="secondary"
          variant="tonal"
          :loading="isDownloadingTemplate"
          @click="handleDownloadTemplate"
        >
          <VIcon icon="tabler-file-download" />
          <span class="d-none d-sm-inline ms-1">File mẫu</span>
        </VBtn>
        <!-- Export -->
        <VBtn
          color="secondary"
          variant="tonal"
          :loading="isExporting"
          @click="handleExport"
        >
          <VIcon icon="tabler-download" />
          <span class="d-none d-sm-inline ms-1">Xuất</span>
        </VBtn>
        <input
          ref="importFileInput"
          type="file"
          accept=".xlsx,.xls,.csv"
          class="d-none"
          @change="handleImportFile"
        >

        <!-- Add -->
        <VBtn
          @click="openAddDrawer"
        >
          <VIcon icon="tabler-plus" />
          <span class="d-none d-sm-inline ms-1">Thêm tổ chức</span>
        </VBtn>
      </template>
    </AppFilterBar>

    <!-- Table Card -->
    <VCard
      elevation="0"
      border
    >

      <VDivider />

      <VDataTableServer
        v-model="selected"
        :headers="headers"
        :items="organizations"
        :items-length="total"
        item-value="id"
        show-select
        return-object
        class="text-no-wrap"
      >
        <!-- STT -->
        <template #item.index="{ index }">
          <span>{{ indexOffset + index + 1 }}</span>
        </template>

        <!-- Tên tổ chức -->
        <template #item.name="{ item }">
          <div class="d-flex flex-column">
            <span class="font-weight-medium">{{"-".repeat(item.depth)}} {{ item.name }}</span>
          </div>
        </template>


        <!-- Trạng thái -->
        <template #item.status="{ item }">
          <VSwitch
            :model-value="item.status === 'active'"
            :loading="statusToggleItem?.id === item.id && isStatusToggleDialogVisible"
            @click="handleToggleStatus(item)"
            @update:model-value="handleToggleStatus(item)"
          />
        </template>

        <!-- Người tạo / Ngày tạo -->
        <template #item.created_info="{ item }">
          <AppUserDateInfo
            :user="item.created_by"
            :date="item.created_at"
          />
        </template>

        <!-- Người cập nhật / Ngày cập nhật -->
        <template #item.updated_info="{ item }">
          <AppUserDateInfo
            :user="item.updated_by"
            :date="item.updated_at"
          />
        </template>

        <!-- Thao tác -->
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

        <!-- No Data -->
        <template #no-data>
          <div class="text-center py-10">
            <VIcon
              icon="tabler-building-off"
              size="48"
              color="disabled"
              class="mb-4"
            />
            <div class="text-body-1 text-disabled">
              Không có tổ chức nào
            </div>
          </div>
        </template>

        <template #bottom>
          <AppPagination
            :page="orgStore.filters?.page || 1"
            :limit="orgStore.filters?.limit || 10"
            :total="total"
            :limit-options="[10, 15, 20, 50, 100]"
            :loading="isLoading"
            @update:page="(p) => { orgStore.setFilters({ page: p }); fetchOrganizations() }"
            @update:limit="(l) => { orgStore.setFilters({ limit: l, page: 1 }); fetchOrganizations() }"
          />
        </template>
      </VDataTableServer>
    </VCard>

    <!-- Form Drawer -->
    <OrganizationFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :organization="editingOrg"
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
        Bạn có chắc chắn muốn xóa tổ chức này? Hành động này không thể hoàn tác.
      </template>
      <template v-else>
        Bạn có chắc chắn muốn xóa <strong>{{ selected.length }} tổ chức</strong> đã chọn?
      </template>
    </AppConfirmDialog>

    <!-- Bulk Status Dialog -->
    <VDialog
      v-model="isBulkStatusDialogVisible"
      max-width="400"
      persistent
    >
      <VCard rounded="lg">
        <VCardTitle class="pt-6 px-6">
          Cập nhật trạng thái hàng loạt
        </VCardTitle>
        <VCardText class="px-6">
          <p class="mb-4">
            Cập nhật trạng thái cho <strong>{{ selected.length }} tổ chức</strong> đã chọn:
          </p>
          <AppSelect
            v-model="bulkStatusValue"
            label="Trạng thái mới"
            :items="bulkStatusOptions"
          />
        </VCardText>
        <VCardActions class="px-6 pb-6">
          <VSpacer />
          <VBtn
            variant="tonal"
            color="secondary"
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

    <!-- Status Toggle Confirmation Dialog -->
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

    <!-- Snackbar -->
    <AppSnackbar
      v-model="snackbar.show"
      :message="snackbar.message"
      :color="snackbar.color"
    />
  </section>
</template>
