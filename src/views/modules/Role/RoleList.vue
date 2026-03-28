<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import RoleFormDrawer from './RoleFormDrawer.vue'
import { useRoleStore } from '@/store/modules/role'
import type { Role } from '@/api/modules/role'

const roleStore = useRoleStore()

const isFormDrawerVisible = ref(false)
const editingRole = ref<Role | null>(null)
const selectedIds = ref<number[]>([])

const searchQuery = ref('')
const snackbar = ref({ show: false, message: '', color: 'success' })
const confirmDialog = ref({ show: false, title: '', message: '', onConfirm: () => {} })

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

  roleStore.setFilters({
    page: options.page,
    limit: options.itemsPerPage,
    sort_by: sortBy?.key as any || 'created_at',
    sort_order: sortBy?.order || 'desc',
  })
  loadRoles()
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

onMounted(async () => {
  await Promise.all([roleStore.fetchStats(), loadRoles()])
})
</script>

<template>
  <div>
    <!-- Stats -->
    <VRow class="mb-6">
      <VCol
        cols="12"
        md="6"
      >
        <VCard
          elevation="0"
          border
        >
          <VCardText class="d-flex align-center gap-4">
            <VAvatar
              color="primary"
              variant="tonal"
              size="48"
              rounded
            >
              <VIcon
                icon="tabler-shield-half"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ roleStore.stats?.total ?? 0 }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Tổng số vai trò
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Toolbar -->
    <VCard
      elevation="0"
      border
      class="mb-4"
    >
      <VCardText class="d-flex flex-wrap align-center gap-3 py-3">
        <AppTextField
          v-model="searchQuery"
          placeholder="Tìm kiếm vai trò..."
          prepend-inner-icon="tabler-search"
          clearable
          style="min-inline-size: 240px; max-inline-size: 320px;"
        />

        <VSpacer />

        <VBtn
          v-if="selectedIds.length > 0"
          variant="tonal"
          color="error"
          prepend-icon="tabler-trash"
          @click="handleBulkDelete"
        >
          Xóa ({{ selectedIds.length }})
        </VBtn>

        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-download"
          @click="handleExport"
        >
          Xuất dữ liệu
        </VBtn>

        <VBtn
          prepend-icon="tabler-plus"
          @click="openCreateDrawer"
        >
          Thêm mới
        </VBtn>
      </VCardText>
    </VCard>

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
        :loading="roleStore.isLoading"
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
      </VDataTableServer>
    </VCard>

    <!-- Form Drawer -->
    <RoleFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :role="editingRole"
      @submit="handleFormSubmit"
    />

    <!-- Confirm Dialog -->
    <VDialog
      v-model="confirmDialog.show"
      max-width="440"
    >
      <VCard>
        <VCardTitle class="pt-6 px-6">
          {{ confirmDialog.title }}
        </VCardTitle>
        <VCardText class="px-6">
          {{ confirmDialog.message }}
        </VCardText>
        <VCardActions class="px-6 pb-6">
          <VSpacer />
          <VBtn
            variant="tonal"
            color="secondary"
            @click="confirmDialog.show = false"
          >
            Hủy
          </VBtn>
          <VBtn
            color="error"
            @click="() => { confirmDialog.onConfirm(); confirmDialog.show = false }"
          >
            Xác nhận
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

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
  </div>
</template>
