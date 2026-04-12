<script setup lang="ts">
// eslint-disable-next-line import/extensions, import/no-unresolved
import { getErrorMessage } from '@/utils/errorMessage'
import { computed, onMounted, ref, watch } from 'vue'
import RoleFormDrawer from './RoleFormDrawer.vue'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppPagination from '@/components/AppPagination.vue'
import { useRoleStore } from '@/store/modules/role'
import type { Role } from '@/api/modules/role'
import AppUserDateInfo from '@/components/AppUserDateInfo.vue'

const roleStore = useRoleStore()

const isFormDrawerVisible = ref(false)
const editingRole = ref<Role | null>(null)
const selectedIds = ref<number[]>([])
const importFileInput = ref<HTMLInputElement>()
const isImporting = ref(false)

const searchQuery = ref('')
const snackbar = ref({ show: false, message: '', color: 'success' })
const confirmDialog = ref({ show: false, title: '', message: '', onConfirm: () => {} })

const hasActiveFilters = computed(() => !!searchQuery.value)

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  confirmDialog.value = { show: true, title, message, onConfirm }
}

const headers = [
  { title: 'STT', key: 'stt', sortable: false, width: '60px', minWidth: '60px' },
  { title: 'TÊN VAI TRÒ', key: 'name', sortable: true, minWidth: '200px' },
  { title: 'NGÀY TẠO', key: 'created_at', sortable: true, width: '160px', minWidth: '160px' },
  { title: 'NGÀY CẬP NHẬT', key: 'updated_at', sortable: true, width: '160px', minWidth: '160px' },
  { title: 'HÀNH ĐỘNG', key: 'actions', sortable: false, width: '130px', minWidth: '130px' },
]

const loadRoles = async () => {
  await roleStore.fetchRoles({
    page: roleStore.filters.page,
    limit: roleStore.filters.limit,
    search: searchQuery.value || undefined,
    sort_by: roleStore.filters.sort_by,
    sort_order: roleStore.filters.sort_order,
  })
}

const handleTableUpdate = (options: any) => {
  const sortBy = options.sortBy?.[0]
  const newSortBy = sortBy?.key as any || 'created_at'
  const newSortOrder = sortBy?.order || 'desc'

  if (newSortBy !== roleStore.filters.sort_by || newSortOrder !== roleStore.filters.sort_order) {
    roleStore.setFilters({ sort_by: newSortBy, sort_order: newSortOrder })
    loadRoles()
  }
}

let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    roleStore.setFilters({ page: 1 })
    loadRoles()
  }, 400)
})

const openCreateDrawer = () => {
  editingRole.value = null
  isFormDrawerVisible.value = true
}

const openEditDrawer = (role: Role) => {
  editingRole.value = role
  isFormDrawerVisible.value = true
}

const handleFormSubmit = async () => {
  isFormDrawerVisible.value = false
  await Promise.all([loadRoles(), roleStore.fetchStats()])
}

const handleDelete = (role: Role) => {
  showConfirm(
    'Xác nhận xóa',
    `Bạn có chắc muốn xóa vai trò "${role.name}"?`,
    async () => {
      try {
        await roleStore.deleteRole(role.id)
        showToast('Xóa vai trò thành công!', 'success')
        await Promise.all([loadRoles(), roleStore.fetchStats()])
      }
      catch (err: any) {
        showToast(getErrorMessage(err, 'Xóa vai trò thất bại!'), 'error')
      }
    },
  )
}

const handleBulkDelete = () => {
  if (!selectedIds.value.length)
    return

  showConfirm(
    'Xóa hàng loạt',
    `Bạn có chắc muốn xóa ${selectedIds.value.length} vai trò đã chọn?`,
    async () => {
      try {
        await roleStore.bulkDelete(selectedIds.value)
        selectedIds.value = []
        showToast('Xóa hàng loạt thành công!', 'success')
        await Promise.all([loadRoles(), roleStore.fetchStats()])
      }
      catch (err: any) {
        showToast(getErrorMessage(err, 'Xóa hàng loạt thất bại!'), 'error')
      }
    },
  )
}

const handleExport = async () => {
  try {
    await roleStore.exportRoles({ search: searchQuery.value || undefined })
    showToast('Xuất dữ liệu thành công!', 'success')
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Xuất dữ liệu thất bại!'), 'error')
  }
}

const handleImportClick = () => {
  importFileInput.value?.click()
}

const handleImportFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  // Check file type
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ]

  if (!allowedTypes.includes(file.type)) {
    showToast('Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV!', 'error')
    if (importFileInput.value)
      importFileInput.value.value = ''
    return
  }

  try {
    isImporting.value = true
    await roleStore.importRoles(file)
    showToast('Nhập dữ liệu thành công!', 'success')
    await Promise.all([loadRoles(), roleStore.fetchStats()])
  }
  catch (error: any) {
    const errorMsg = getErrorMessage(error, 'Nhập dữ liệu thất bại!')
    showToast(errorMsg, 'error')
  }
  finally {
    isImporting.value = false
    if (importFileInput.value)
      importFileInput.value.value = ''
  }
}

onMounted(async () => {
  await Promise.all([roleStore.fetchStats(), loadRoles()])
})
</script>

<template>
  <div>

    <!-- Filter & Actions Bar -->
    <AppFilterBar :has-active-filters="hasActiveFilters">
      <template #filters>
        <VCol
          cols="12"
          sm="6"
          md="12"
        >
          <AppTextField
            v-model="searchQuery"
            placeholder="Nhập tên vai trò..."
            prepend-inner-icon="tabler-search"
            clearable
            hide-details
          />
        </VCol>
      </template>

      <template #actions>
        <VBtn
          v-if="selectedIds.length > 0"
          variant="tonal"
          color="error"
          prepend-icon="tabler-trash"
          @click="handleBulkDelete"
        >
          <span class="d-none d-sm-inline">Xóa</span>
          ({{ selectedIds.length }})
        </VBtn>

        <VBtn
          variant="tonal"
          color="secondary"
          :loading="isImporting"
          @click="handleImportClick"
        >
          <VIcon icon="tabler-upload" />
          <span class="d-none d-sm-inline ms-1">Nhập</span>
        </VBtn>
        <input
          ref="importFileInput"
          type="file"
          accept=".xlsx,.xls,.csv"
          class="d-none"
          @change="handleImportFile"
        >

        <VBtn
          variant="tonal"
          color="secondary"
          @click="handleExport"
        >
          <VIcon icon="tabler-download" />
          <span class="d-none d-sm-inline ms-1">Xuất</span>
        </VBtn>

        <VBtn
          @click="openCreateDrawer"
        >
          <VIcon icon="tabler-plus" />
          <span class="d-none d-sm-inline ms-1">Thêm mới</span>
        </VBtn>
      </template>

      <!-- Table (default slot) -->
      <VDataTableServer
        v-model="selectedIds"
        :headers="headers"
        :items="roleStore.roles"
        :items-length="roleStore.total"
        :items-per-page="roleStore.filters.limit || 15"
        :page="roleStore.filters.page || 1"
        item-value="id"
        item-height="64"
        show-select
        @update:options="handleTableUpdate"
      >
        <template #item.stt="{ index }">
          <span class="text-body-1 text-high-emphasis">
            {{ ((roleStore.filters.page || 1) - 1) * (roleStore.filters.limit || 15) + index + 1 }}
          </span>
        </template>

        <template #item.name="{ item }">
          <div class="d-flex align-center gap-x-4">
            <VAvatar
              color="primary"
              variant="tonal"
              size="34"
              rounded
            >
              <VIcon
                icon="tabler-shield-half"
                size="18"
              />
            </VAvatar>
            <div class="d-flex flex-column">
              <h6 class="text-base font-weight-medium text-high-emphasis">
                {{ item.name }}
              </h6>
              <div class="text-sm text-medium-emphasis">
                {{ item.guard_name || 'web' }}
              </div>
            </div>
          </div>
        </template>

        <template #item.created_at="{ item }">
          <div style="max-width: 160px; overflow: hidden;">
            <AppUserDateInfo
              :user="item.created_by"
              :date="item.created_at"
            />
          </div>
        </template>

        <template #item.updated_at="{ item }">
          <div style="max-width: 160px; overflow: hidden;">
            <AppUserDateInfo
              :user="item.updated_by"
              :date="item.updated_at"
            />
          </div>
        </template>

        <template #item.actions="{ item }">
          <IconBtn @click="openEditDrawer(item)">
            <VIcon icon="tabler-edit" />
          </IconBtn>

          <IconBtn
            color="error"
            @click="handleDelete(item)"
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

                <VListItem @click="handleDelete(item)">
                  <template #prepend>
                    <VIcon icon="tabler-trash" />
                  </template>
                  <VListItemTitle>Xóa</VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>
          </VBtn>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <VIcon
              icon="tabler-shield-off"
              size="48"
              color="disabled"
              class="mb-3"
            />
            <div class="text-sm text-disabled">
              Không có vai trò nào
            </div>
          </div>
        </template>

        <template #bottom>
          <AppPagination
            :page="roleStore.filters.page || 1"
            :limit="roleStore.filters.limit || 15"
            :total="roleStore.total"
            :limit-options="[10, 15, 20, 50, 100]"
            :loading="roleStore.isLoading"
            @update:page="(p) => { roleStore.setFilters({ page: p }); loadRoles() }"
            @update:limit="(l) => { roleStore.setFilters({ limit: l, page: 1 }); loadRoles() }"
          />
        </template>
      </VDataTableServer>
    </AppFilterBar>

    <!-- Form Drawer -->
    <RoleFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :role="editingRole"
      @submit="handleFormSubmit"
    />

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
  </div>
</template>

<style scoped>
:deep(.v-data-table__tr) {
  height: 64px;
}
</style>
