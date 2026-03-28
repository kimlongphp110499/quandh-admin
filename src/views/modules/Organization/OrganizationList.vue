<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import OrganizationFormDrawer from './OrganizationFormDrawer.vue'
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

// Import
const importFileInput = ref<HTMLInputElement>()
const isImporting = ref(false)
const isExporting = ref(false)

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

// Table options
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref([{ key: 'sort_order', order: 'asc' }])

const headers = [
  { title: '', key: 'data-table-select', sortable: false },
  { title: 'Tên tổ chức', key: 'name', sortable: true },
  { title: 'Tổ chức cha', key: 'parent', sortable: false },
  { title: 'Cấp', key: 'depth', sortable: true },
  { title: 'Thứ tự', key: 'sort_order', sortable: true },
  { title: 'Trạng thái', key: 'status', sortable: true },
  { title: 'Thao tác', key: 'actions', sortable: false },
]

// Computed
const organizations = computed(() => orgStore.organizations)
const total = computed(() => orgStore.total)
const isLoading = computed(() => orgStore.isLoading)
const selectedIds = computed(() => selected.value.map(o => o.id))

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
    page: page.value,
    limit: itemsPerPage.value,
    search: searchQuery.value || undefined,
    status: selectedStatus.value || undefined,
    sort_by: sortBy.value[0]?.key || 'sort_order',
    sort_order: (sortBy.value[0]?.order as 'asc' | 'desc') || 'asc',
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
  try {
    const newStatus = org.status === 'active' ? 'inactive' : 'active'

    await orgStore.changeStatus(org.id, newStatus)
    showToast('Cập nhật trạng thái thành công!', 'success')
    await orgStore.fetchStats()
  }
  catch {
    showToast('Cập nhật trạng thái thất bại!', 'error')
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

const updateOptions = (options: any) => {
  page.value = options.page
  itemsPerPage.value = options.itemsPerPage
  sortBy.value = options.sortBy
}

// Watchers
watch([searchQuery, selectedStatus], () => {
  page.value = 1
  fetchOrganizations()
})

watch([page, itemsPerPage, sortBy], () => {
  fetchOrganizations()
}, { deep: true })

// Init
fetchOrganizations()
orgStore.fetchStats()
</script>

<template>
  <section>
    <!-- Stats Cards -->
    <VRow class="mb-6">
      <VCol
        cols="12"
        sm="4"
      >
        <VCard>
          <VCardText class="d-flex align-center gap-4">
            <VAvatar
              color="primary"
              variant="tonal"
              size="52"
              rounded
            >
              <VIcon
                icon="tabler-building"
                size="28"
              />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ orgStore.stats?.total ?? '—' }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Tổng tổ chức
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="4"
      >
        <VCard>
          <VCardText class="d-flex align-center gap-4">
            <VAvatar
              color="success"
              variant="tonal"
              size="52"
              rounded
            >
              <VIcon
                icon="tabler-circle-check"
                size="28"
              />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ orgStore.activeCount ?? '—' }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Đang hoạt động
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="4"
      >
        <VCard>
          <VCardText class="d-flex align-center gap-4">
            <VAvatar
              color="secondary"
              variant="tonal"
              size="52"
              rounded
            >
              <VIcon
                icon="tabler-circle-x"
                size="28"
              />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ orgStore.inactiveCount ?? '—' }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Không hoạt động
              </div>
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
              { value: -1, title: 'Tất cả' },
            ]"
            style="inline-size: 5.5rem;"
            @update:model-value="itemsPerPage = parseInt($event, 10)"
          />
        </div>

        <VSpacer />

        <!-- Actions -->
        <div class="d-flex align-center flex-wrap gap-4">
          <!-- Bulk actions -->
          <template v-if="selected.length > 0">
            <span class="text-body-2 text-disabled">Đã chọn {{ selected.length }} mục</span>
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
            placeholder="Tìm kiếm tổ chức..."
            prepend-inner-icon="tabler-search"
            style="inline-size: 15rem;"
          />

          <!-- Export -->
          <VBtn
            color="secondary"
            variant="tonal"
            prepend-icon="tabler-download"
            :loading="isExporting"
            @click="handleExport"
          >
            Xuất
          </VBtn>

          <!-- Import -->
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

          <!-- Add -->
          <VBtn
            prepend-icon="tabler-plus"
            @click="openAddDrawer"
          >
            Thêm tổ chức
          </VBtn>
        </div>
      </VCardText>

      <VDivider />

      <VDataTableServer
        v-model="selected"
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :headers="headers"
        :items="organizations"
        :items-length="total"
        :loading="isLoading"
        item-value="id"
        show-select
        return-object
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <!-- Tên tổ chức -->
        <template #item.name="{ item }">
          <div class="d-flex flex-column">
            <span class="font-weight-medium text-high-emphasis">{{ item.name }}</span>
            <small
              v-if="item.description"
              class="text-disabled"
            >
              {{ item.description.substring(0, 60) }}{{ item.description.length > 60 ? '...' : '' }}
            </small>
          </div>
        </template>

        <!-- Tổ chức cha -->
        <template #item.parent="{ item }">
          <span
            v-if="item.parent"
            class="text-body-2"
          >
            {{ item.parent.name }}
          </span>
          <span
            v-else
            class="text-disabled text-body-2"
          >—</span>
        </template>

        <!-- Cấp -->
        <template #item.depth="{ item }">
          <VChip
            size="small"
            variant="tonal"
            color="primary"
          >
            Cấp {{ item.depth + 1 }}
          </VChip>
        </template>

        <!-- Trạng thái -->
        <template #item.status="{ item }">
          <VChip
            :color="resolveStatusVariant(item.status)"
            size="small"
            class="cursor-pointer"
            @click="handleToggleStatus(item)"
          >
            {{ resolveStatusLabel(item.status) }}
          </VChip>
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
      </VDataTableServer>
    </VCard>

    <!-- Form Drawer -->
    <OrganizationFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :organization="editingOrg"
      @submit="handleFormSubmit"
    />

    <!-- Delete Confirm Dialog -->
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
            Bạn có chắc chắn muốn xóa tổ chức này? Hành động này không thể hoàn tác.
          </template>
          <template v-else>
            Bạn có chắc chắn muốn xóa <strong>{{ selected.length }} tổ chức</strong> đã chọn?
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
            Cập nhật trạng thái cho <strong>{{ selected.length }} tổ chức</strong> đã chọn:
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
