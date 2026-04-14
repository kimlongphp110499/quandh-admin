<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import OrganizationFormDrawer from '../../../components/OrganizationFormDrawer.vue'
import { getErrorMessage } from '@/utils/errorMessage'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSystemPageHeader from '@/components/AppSystemPageHeader.vue'
import AppUserDateInfo from '@/components/AppUserDateInfo.vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useOrganizationStore } from '../../../stores/useOrganizationStore'

import type { Organization } from '@/api/modules/organization'

const orgStore = useOrganizationStore()

// State
const searchQuery = ref('')
const selectedStatus = ref<string | null>(null)

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
  { title: 'STT', key: 'index', sortable: false, align: 'center' as const, width: '60px', minWidth: '60px' },
  { title: 'Tên tổ chức', key: 'name', sortable: true, align: 'start' as const, minWidth: '200px' },
  { title: 'Trạng thái', key: 'status', sortable: true, align: 'start' as const, width: '120px', minWidth: '120px' },
  { title: 'Ngày tạo', key: 'created_info', sortable: false, align: 'start' as const, width: '160px', minWidth: '160px' },
  { title: 'Ngày cập nhật', key: 'updated_info', sortable: false, align: 'start' as const, width: '160px', minWidth: '160px' },
  { title: 'Hành động', key: 'actions', sortable: false, align: 'start' as const, width: '120px', minWidth: '160px' },
]

// Computed
const organizations = computed(() => orgStore.items)
const total = computed(() => orgStore.total)
const isLoading = computed(() => orgStore.isLoading)
const selectedIds = computed(() => selected.value.map(o => o.id))
const indexOffset = computed(() => ((orgStore.filters.page ?? 1) - 1) * (orgStore.filters.limit ?? 10))

// Methods
const fetchOrganizations = async () => {
  await orgStore.fetchItems({
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
      await orgStore.deleteItem(deletingId.value)
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
  catch (err: any) {
    showToast(getErrorMessage(err, 'Xóa thất bại!'), 'error')
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
  catch (err: any) {
    showToast(getErrorMessage(err, 'Cập nhật trạng thái thất bại!'), 'error')
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

// Bulk actions
const handleBulkStatus = (status: 'active' | 'inactive') => {
  if (!selectedIds.value.length)
    return

  const label = status === 'active' ? 'hoạt động' : status === 'inactive' ? 'không hoạt động' : 'vô hiệu hoá'

  showConfirm(
    'Cập nhật trạng thái hàng loạt',
    `Bạn có chắc muốn ${label} ${selectedIds.value.length} tổ chức đã chọn?`,
    async () => {
      try {
        await orgStore.bulkUpdateStatus(selectedIds.value, status)
        selected.value = []
        showToast('Cập nhật trạng thái thành công!', 'success')
        await Promise.all([fetchOrganizations(), orgStore.fetchStats()])
      }
      catch (err: any) {
        showToast(getErrorMessage(err, 'Cập nhật trạng thái thất bại!'), 'error')
      }
    },
  )
}

// Confirm dialog
const confirmDialog = ref({ show: false, title: '', message: '', onConfirm: () => {}, loading: false })

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  confirmDialog.value = { show: true, title, message, onConfirm, loading: false }
}

const handleBulkUpdateStatus = async () => {
  try {
    await orgStore.bulkUpdateStatus(selectedIds.value, bulkStatusValue.value)
    showToast(`Đã cập nhật trạng thái ${selectedIds.value.length} tổ chức!`, 'success')
    selected.value = []
    isBulkStatusDialogVisible.value = false
    await Promise.all([fetchOrganizations(), orgStore.fetchStats()])
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Cập nhật trạng thái thất bại!'), 'error')
    isBulkStatusDialogVisible.value = false
  }
}

const handleExport = async () => {
  isExporting.value = true
  try {
    await orgStore.exportItems({
      search: searchQuery.value || undefined,
      status: selectedStatus.value || undefined,
    })
    showToast('Xuất file thành công!', 'success')
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Xuất file thất bại!'), 'error')
  }
  finally {
    isExporting.value = false
  }
}

const triggerImport = () => importFileInput.value?.click()

const handleImportFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  isImporting.value = true
  try {
    await orgStore.importItems(file)
    showToast('Nhập dữ liệu thành công!', 'success')
    await Promise.all([fetchOrganizations(), orgStore.fetchStats()])
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Nhập dữ liệu thất bại!'), 'error')
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
        <VCol
          cols="12"
          sm="6"
          md="6"
        >
          <AppTextField
            v-model="searchQuery"
            placeholder="Nhập tên tổ chức..."
            prepend-inner-icon="tabler-search"
            hide-details
            clearable
          />
        </VCol>

        <!-- Status Filter -->
        <VCol
          cols="12"
          sm="6"
          md="6"
        >
          <AppSelect
            v-model="selectedStatus"
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
          :loading="isImporting"
          @click="triggerImport"
        >
          <VIcon icon="tabler-upload" />
          <span class="d-none d-sm-inline ms-1">Nhập</span>
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
        <VBtn @click="openAddDrawer">
          <VIcon icon="tabler-plus" />
          <span class="d-none d-sm-inline ms-1">Thêm mới</span>
        </VBtn>
      </template>

      <!-- Table (default slot — gắn liền với filter card) -->
      <VDataTableServer
        v-model="selected"
        :headers="headers"
        :items="organizations"
        :items-length="total"
        item-value="id"
        item-height="64"
        show-select
        return-object
        class="text-no-wrap"
      >
        <!-- STT -->
        <template #item.index="{ index }">
          <span class="text-body-1 text-high-emphasis">{{ indexOffset + index + 1 }}</span>
        </template>

        <!-- Tên tổ chức -->
        <template #item.name="{ item }">
          <div class="d-flex flex-column">
            <span class="text-base font-weight-medium text-high-emphasis">
              {{ '-'.repeat(item.depth) }} {{ item.name }}
            </span>
          </div>
        </template>

        <!-- Trạng thái -->
        <template #item.status="{ item }">
          <VSwitch
            :model-value="item.status === 'active'"
            inset
            hide-details
            density="compact"
            :loading="statusToggleItem?.id === item.id && isStatusToggleDialogVisible"
            @click="handleToggleStatus(item)"
            @update:model-value="handleToggleStatus(item)"
          />
        </template>

        <!-- Người tạo / Ngày tạo -->
        <template #item.created_info="{ item }">
          <div style="max-width: 160px; overflow: hidden;">
            <AppUserDateInfo
              :user="item.created_by"
              :date="item.created_at"
            />
          </div>
        </template>

        <!-- Người cập nhật / Ngày cập nhật -->
        <template #item.updated_info="{ item }">
          <div style="max-width: 160px; overflow: hidden;">
            <AppUserDateInfo
              :user="item.updated_by"
              :date="item.updated_at"
            />
          </div>
        </template>

        <!-- Thao tác -->
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
              icon="tabler-building-off"
              size="48"
              color="disabled"
              class="mb-4"
            />
            <div class="text-sm text-disabled">
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
    </AppFilterBar>

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
    <!-- Confirm Dialog -->
    <AppConfirmDialog
      v-model="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      @confirm="() => { confirmDialog.onConfirm(); confirmDialog.show = false }"
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
