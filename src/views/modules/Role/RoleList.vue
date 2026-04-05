<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import RoleFormDrawer from './RoleFormDrawer.vue'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSystemPageHeader from '@/components/AppSystemPageHeader.vue'
import { useRoleStore } from '@/store/modules/role'
import type { Role } from '@/api/modules/role'

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
  { title: 'STT', key: 'stt', sortable: false, width: '64px' },
  { title: 'TÊN VAI TRÒ', key: 'name', sortable: true },
  { title: 'TỔNG NGƯỜI DÙNG', key: 'users_count', sortable: false, width: '160px' },
  { title: 'NGÀY TẠO', key: 'created_at', sortable: true, width: '160px' },
  { title: 'HÀNH ĐỘNG', key: 'actions', sortable: false, width: '120px' },
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
      catch {
        showToast('Xóa vai trò thất bại!', 'error')
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
      catch {
        showToast('Xóa hàng loạt thất bại!', 'error')
      }
    },
  )
}

const handleExport = async () => {
  try {
    await roleStore.exportRoles({ search: searchQuery.value || undefined })
    showToast('Xuất dữ liệu thành công!', 'success')
  }
  catch {
    showToast('Xuất dữ liệu thất bại!', 'error')
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
    const errorMsg = error.response?.data?.message || 'Nhập dữ liệu thất bại!'
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
        <div style="max-inline-size: 100%; flex: 1;">
          <div class="text-caption text-medium-emphasis mb-1">
            Tìm kiếm vai trò
          </div>
          <AppTextField
            v-model="searchQuery"
            placeholder="Nhập tên vai trò..."
            prepend-inner-icon="tabler-search"
            clearable
            hide-details
          />
        </div>
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
          prepend-icon="tabler-upload"
          :loading="isImporting"
          @click="handleImportClick"
        >
          <span class="d-none d-sm-inline">Nhập dữ liệu</span>
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
          prepend-icon="tabler-download"
          @click="handleExport"
        >
          <span class="d-none d-sm-inline">Xuất dữ liệu</span>
        </VBtn>

        <VBtn
          prepend-icon="tabler-plus"
          @click="openCreateDrawer"
        >
          <span class="d-none d-sm-inline">Thêm mới</span>
        </VBtn>
      </template>
    </AppFilterBar>

    <!-- Table -->
    <VCard
      elevation="0"
      border
    >
      <VDataTableServer
        v-model="selectedIds"
        :headers="headers"
        :items="roleStore.roles"
        :items-length="roleStore.total"
        :items-per-page="roleStore.filters.limit || 15"
        :page="roleStore.filters.page || 1"
        item-value="id"
        show-select
        @update:options="handleTableUpdate"
      >
        <template #item.stt="{ index }">
          <span class="text-body-2 text-medium-emphasis">
            {{ ((roleStore.filters.page || 1) - 1) * (roleStore.filters.limit || 15) + index + 1 }}
          </span>
        </template>

        <template #item.name="{ item }">
          <div class="d-flex align-center gap-3">
            <VAvatar
              color="primary"
              variant="tonal"
              size="36"
              rounded
            >
              <VIcon
                icon="tabler-shield-half"
                size="18"
              />
            </VAvatar>
            <div>
              <div class="font-weight-medium">
                {{ item.name }}
              </div>
              <div class="text-caption text-disabled">
                {{ item.guard_name || 'web' }}
              </div>
            </div>
          </div>
        </template>

        <template #item.users_count="{ item }">
          <VChip
            size="small"
            color="info"
            variant="tonal"
          >
            {{ item.users_count ?? 0 }} người dùng
          </VChip>
        </template>

        <template #item.created_at="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.created_at }}</span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center gap-1">
            <IconBtn
              size="small"
              @click="openEditDrawer(item)"
            >
              <VIcon
                icon="tabler-edit"
                size="18"
              />
              <VTooltip
                activator="parent"
                location="top"
              >
                Chỉnh sửa vai trò
              </VTooltip>
            </IconBtn>

            <IconBtn
              size="small"
              color="error"
              @click="handleDelete(item)"
            >
              <VIcon
                icon="tabler-trash"
                size="18"
              />
              <VTooltip
                activator="parent"
                location="top"
              >
                Xóa
              </VTooltip>
            </IconBtn>
          </div>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <VIcon
              icon="tabler-shield-off"
              size="48"
              color="disabled"
              class="mb-3"
            />
            <div class="text-body-1 text-disabled">
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
    </VCard>

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
