<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import UserFormDrawer from './UserFormDrawer.vue'
import { useUserStore } from '@/store/modules/user'

import { useOrganizationStore } from '@/store/modules/organization'

import { type User, userApi } from '@/api/modules/user'

const userStore = useUserStore()
const orgStore = useOrganizationStore()

// State
const isFormDrawerVisible = ref(false)
const editingUser = ref<User | null>(null)
const selectedIds = ref<number[]>([])
const importFileInput = ref<HTMLInputElement>()

// Filters
const searchQuery = ref('')
const statusFilter = ref<string>('')
const organizationFilter = ref<number | null>(null)

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

// Confirm dialog
const confirmDialog = ref({ show: false, title: '', message: '', onConfirm: () => {} })

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  confirmDialog.value = { show: true, title, message, onConfirm }
}

// Table headers
const headers = [
  { title: 'STT', key: 'stt', sortable: false, width: '60px' },
  { title: 'TÊN NGƯỜI DÙNG', key: 'name', sortable: true, minWidth: '200px' },
  { title: 'EMAIL', key: 'email', sortable: true, minWidth: '180px' },
  { title: 'TỔ CHỨC & VAI TRÒ', key: 'assignments', sortable: false, minWidth: '200px' },
  { title: 'NGÀY CẬP NHẬT', key: 'updated_at', sortable: true, width: '160px' },
  { title: 'TRẠNG THÁI', key: 'status', sortable: false, width: '130px' },
  { title: 'HÀNH ĐỘNG', key: 'actions', sortable: false, width: '120px' },
]

const statusOptions = [
  { title: 'Tất cả trạng thái', value: '' },
  { title: 'Hoạt động', value: 'active' },
  { title: 'Không hoạt động', value: 'inactive' },
  { title: 'Bị khóa', value: 'banned' },
]

const orgOptions = ref<{ title: string; value: number | null }[]>([{ title: 'Tất cả tổ chức', value: null }])

const statusColor = (status: string) => {
  if (status === 'active')
    return 'success'
  if (status === 'banned')
    return 'error'

  return 'warning'
}

const statusLabel = (status: string) => {
  if (status === 'active')
    return 'Hoạt động'
  if (status === 'banned')
    return 'Bị khóa'

  return 'Không HĐ'
}

const formatDate = (dateStr: string) => {
  if (!dateStr)
    return '—'

  // Laravel trả về "2024-01-15 10:30:00" (space) — Safari không parse được → đổi thành "T"
  const normalized = dateStr.replace(' ', 'T')
  const d = new Date(normalized)

  if (Number.isNaN(d.getTime()))
    return dateStr

  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const getUserInitials = (name: string) => {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const avatarColor = (id: number) => {
  const colors = ['primary', 'info', 'success', 'warning', 'error', 'secondary']

  return colors[id % colors.length]
}

// Load data
const loadUsers = async () => {
  await userStore.fetchUsers({
    page: userStore.filters.page,
    limit: userStore.filters.limit,
    search: searchQuery.value || undefined,
    status: statusFilter.value as any || undefined,
    organization_id: organizationFilter.value || undefined,
    sort_by: userStore.filters.sort_by,
    sort_order: userStore.filters.sort_order,
  })
}

const handleTableUpdate = (options: any) => {
  const sortBy = options.sortBy?.[0]

  userStore.setFilters({
    page: options.page,
    limit: options.itemsPerPage,
    sort_by: sortBy?.key as any || 'created_at',
    sort_order: sortBy?.order || 'desc',
  })

  loadUsers()
}

// Filter watchers
let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    userStore.setFilters({ page: 1 })
    loadUsers()
  }, 400)
})

watch([statusFilter, organizationFilter], () => {
  userStore.setFilters({ page: 1 })
  loadUsers()
})

// Reset filters
const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  organizationFilter.value = null
  userStore.resetFilters()
  loadUsers()
}

// Form actions
const openCreateDrawer = () => {
  editingUser.value = null
  isFormDrawerVisible.value = true
}

const openEditDrawer = (user: User) => {
  editingUser.value = user
  isFormDrawerVisible.value = true
}

const handleFormSubmit = async () => {
  isFormDrawerVisible.value = false
  await Promise.all([loadUsers(), userStore.fetchStats()])
}

// Delete
const handleDelete = (user: User) => {
  showConfirm(
    'Xác nhận xóa',
    `Bạn có chắc muốn xóa người dùng "${user.name}"? Hành động này không thể hoàn tác.`,
    async () => {
      try {
        await userStore.deleteUser(user.id)
        showToast('Xóa người dùng thành công!', 'success')
        await Promise.all([loadUsers(), userStore.fetchStats()])
      }
      catch {
        showToast('Xóa người dùng thất bại!', 'error')
      }
    },
  )
}

// Reset password dialog
const resetPasswordDialog = ref({ show: false, userId: 0, userName: '', password: '', password_confirmation: '', isVisible: false, isConfirmVisible: false, isSubmitting: false })

const handleResetPassword = (user: User) => {
  resetPasswordDialog.value = {
    show: true,
    userId: user.id,
    userName: user.name,
    password: '',
    password_confirmation: '',
    isVisible: false,
    isConfirmVisible: false,
    isSubmitting: false,
  }
}

const submitResetPassword = async () => {
  if (!resetPasswordDialog.value.password)
    return

  resetPasswordDialog.value.isSubmitting = true
  try {
    await userApi.resetPassword(resetPasswordDialog.value.userId, {
      password: resetPasswordDialog.value.password,
      password_confirmation: resetPasswordDialog.value.password_confirmation,
    })
    resetPasswordDialog.value.show = false
    showToast('Đặt lại mật khẩu thành công!', 'success')
  }
  catch {
    showToast('Đặt lại mật khẩu thất bại!', 'error')
  }
  finally {
    resetPasswordDialog.value.isSubmitting = false
  }
}

// Status toggle
const handleToggleStatus = async (user: User) => {
  try {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'

    await userStore.changeStatus(user.id, newStatus)
    showToast('Cập nhật trạng thái thành công!', 'success')
    await loadUsers()
  }
  catch {
    showToast('Cập nhật trạng thái thất bại!', 'error')
  }
}

// Bulk actions
const handleBulkStatus = (status: 'active' | 'inactive' | 'banned') => {
  if (!selectedIds.value.length)
    return

  const label = status === 'active' ? 'kích hoạt' : status === 'inactive' ? 'vô hiệu hóa' : 'khóa'

  showConfirm(
    'Cập nhật trạng thái hàng loạt',
    `Bạn có chắc muốn ${label} ${selectedIds.value.length} người dùng đã chọn?`,
    async () => {
      try {
        await userStore.bulkUpdateStatus(selectedIds.value, status)
        selectedIds.value = []
        showToast('Cập nhật trạng thái thành công!', 'success')
        await Promise.all([loadUsers(), userStore.fetchStats()])
      }
      catch {
        showToast('Cập nhật trạng thái thất bại!', 'error')
      }
    },
  )
}

const handleBulkDelete = () => {
  if (!selectedIds.value.length)
    return

  showConfirm(
    'Xóa hàng loạt',
    `Bạn có chắc muốn xóa ${selectedIds.value.length} người dùng đã chọn?`,
    async () => {
      try {
        await userStore.bulkDelete(selectedIds.value)
        selectedIds.value = []
        showToast('Xóa hàng loạt thành công!', 'success')
        await Promise.all([loadUsers(), userStore.fetchStats()])
      }
      catch {
        showToast('Xóa hàng loạt thất bại!', 'error')
      }
    },
  )
}

// Export
const handleExport = async () => {
  try {
    await userStore.exportUsers({
      search: searchQuery.value || undefined,
      status: statusFilter.value as any || undefined,
      organization_id: organizationFilter.value || undefined,
    })
    showToast('Xuất dữ liệu thành công!', 'success')
  }
  catch {
    showToast('Xuất dữ liệu thất bại!', 'error')
  }
}

// Import
const handleImportClick = () => {
  importFileInput.value?.click()
}

const handleImportFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  try {
    await userStore.importUsers(file)
    showToast('Nhập dữ liệu thành công!', 'success')
    await Promise.all([loadUsers(), userStore.fetchStats()])
  }
  catch {
    showToast('Nhập dữ liệu thất bại!', 'error')
  }
  finally {
    if (importFileInput.value)
      importFileInput.value.value = ''
  }
}

onMounted(async () => {
  await Promise.all([
    userStore.fetchStats(),
    loadUsers(),
    orgStore.fetchParentOptions(),
  ])

  orgOptions.value = [
    { title: 'Tất cả tổ chức', value: null },
    ...orgStore.parentOptions.map(o => ({ title: o.name, value: o.id })),
  ]
})

watch(() => orgStore.parentOptions, opts => {
  orgOptions.value = [
    { title: 'Tất cả tổ chức', value: null },
    ...opts.map(o => ({ title: o.name, value: o.id })),
  ]
}, { deep: true })
</script>

<template>
  <div>
    <!-- Stats Cards -->
    <VRow class="mb-6">
      <VCol
        cols="12"
        md="4"
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
                icon="tabler-users"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ userStore.stats?.total ?? 0 }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Tổng số người dùng
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <VCard
          elevation="0"
          border
        >
          <VCardText class="d-flex align-center gap-4">
            <VAvatar
              color="success"
              variant="tonal"
              size="48"
              rounded
            >
              <VIcon
                icon="tabler-user-check"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ userStore.stats?.active ?? 0 }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Người dùng đang hoạt động
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <VCard
          elevation="0"
          border
        >
          <VCardText class="d-flex align-center gap-4">
            <VAvatar
              color="warning"
              variant="tonal"
              size="48"
              rounded
            >
              <VIcon
                icon="tabler-user-off"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ userStore.stats?.inactive ?? 0 }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Người dùng không hoạt động
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Filter & Actions Bar -->
    <VCard
      elevation="0"
      border
      class="mb-4"
    >
      <VCardText class="d-flex flex-wrap align-center gap-3 py-3">
        <!-- Search -->
        <AppTextField
          v-model="searchQuery"
          placeholder="Tìm kiếm người dùng..."
          prepend-inner-icon="tabler-search"
          clearable
          style="min-inline-size: 240px; max-inline-size: 300px;"
        />

        <!-- Org filter -->
        <AppSelect
          v-model="organizationFilter"
          :items="orgOptions"
          placeholder="Tổ chức"
          style="min-inline-size: 180px;"
          clearable
        />

        <!-- Status filter -->
        <AppSelect
          v-model="statusFilter"
          :items="statusOptions"
          placeholder="Trạng thái"
          style="min-inline-size: 160px;"
        />

        <!-- Reset -->
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          @click="resetFilters"
        >
          Đặt lại
        </VBtn>

        <VSpacer />

        <!-- Bulk actions -->
        <template v-if="selectedIds.length > 0">
          <VBtn
            variant="tonal"
            color="success"
            prepend-icon="tabler-user-check"
            @click="handleBulkStatus('active')"
          >
            Kích hoạt ({{ selectedIds.length }})
          </VBtn>
          <VBtn
            variant="tonal"
            color="warning"
            prepend-icon="tabler-user-off"
            @click="handleBulkStatus('inactive')"
          >
            Vô hiệu ({{ selectedIds.length }})
          </VBtn>
          <VBtn
            variant="tonal"
            color="error"
            prepend-icon="tabler-trash"
            @click="handleBulkDelete"
          >
            Xóa ({{ selectedIds.length }})
          </VBtn>
        </template>

        <!-- Import -->
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-upload"
          @click="handleImportClick"
        >
          Nhập dữ liệu
        </VBtn>
        <input
          ref="importFileInput"
          type="file"
          accept=".xlsx,.xls,.csv"
          class="d-none"
          @change="handleImportFile"
        >

        <!-- Export -->
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-download"
          @click="handleExport"
        >
          Xuất dữ liệu
        </VBtn>

        <!-- Add new -->
        <VBtn
          prepend-icon="tabler-plus"
          @click="openCreateDrawer"
        >
          Thêm mới
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Data Table -->
    <VCard
      elevation="0"
      border
    >
      <VDataTableServer
        v-model="selectedIds"
        :headers="headers"
        :items="userStore.users"
        :items-length="userStore.total"
        :loading="userStore.isLoading"
        :items-per-page="userStore.filters.limit || 10"
        :page="userStore.filters.page || 1"
        item-value="id"
        show-select
        @update:options="handleTableUpdate"
      >
        <!-- STT -->
        <template #item.stt="{ index }">
          <span class="text-body-2 text-medium-emphasis">
            {{ ((userStore.filters.page || 1) - 1) * (userStore.filters.limit || 10) + index + 1 }}
          </span>
        </template>

        <!-- Name + username -->
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-3">
            <VAvatar
              :color="avatarColor(item.id)"
              variant="tonal"
              size="36"
              rounded
            >
              <span class="text-caption font-weight-bold">{{ getUserInitials(item.name) }}</span>
            </VAvatar>
            <div>
              <div class="font-weight-medium text-high-emphasis">
                {{ item.name }}
              </div>
              <div class="text-caption text-disabled">
                @{{ item.user_name || item.email.split('@')[0] }}
              </div>
            </div>
          </div>
        </template>

        <!-- Email -->
        <template #item.email="{ item }">
          <span class="text-body-2">{{ item.email }}</span>
        </template>

        <!-- Assignments -->
        <template #item.assignments="{ item }">
          <div
            v-if="item.assignments && item.assignments.length > 0"
            class="d-flex flex-column gap-1 py-1"
          >
            <div
              v-for="(assignment, idx) in item.assignments.slice(0, 2)"
              :key="idx"
              class="d-flex align-center gap-1 flex-wrap"
            >
              <VChip
                v-if="assignment.role_name"
                size="x-small"
                color="primary"
                variant="tonal"
                prepend-icon="tabler-shield"
              >
                {{ assignment.role_name }}
              </VChip>
              <VChip
                v-for="org in (assignment.organizations ?? []).slice(0, 1)"
                :key="org.id"
                size="x-small"
                color="info"
                variant="tonal"
                prepend-icon="tabler-building"
              >
                {{ org.name }}
              </VChip>
              <VChip
                v-if="(assignment.organizations ?? []).length > 1"
                size="x-small"
                variant="outlined"
                color="secondary"
              >
                +{{ (assignment.organizations ?? []).length - 1 }}
              </VChip>
            </div>
            <VChip
              v-if="item.assignments.length > 2"
              size="x-small"
              variant="outlined"
              color="secondary"
            >
              +{{ item.assignments.length - 2 }} vai trò khác
            </VChip>
          </div>
          <span
            v-else
            class="text-disabled text-caption"
          >Chưa phân công</span>
        </template>

        <!-- Updated at -->
        <template #item.updated_at="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatDate(item.updated_at) }}</span>
        </template>

        <!-- Status -->
        <template #item.status="{ item }">
          <VChip
            :color="statusColor(item.status)"
            size="small"
            class="cursor-pointer"
            @click="handleToggleStatus(item)"
          >
            {{ statusLabel(item.status) }}
          </VChip>
        </template>

        <!-- Actions -->
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
                Sửa
              </VTooltip>
            </IconBtn>

            <IconBtn
              size="small"
              color="warning"
              @click="handleResetPassword(item)"
            >
              <VIcon
                icon="tabler-key"
                size="18"
              />
              <VTooltip
                activator="parent"
                location="top"
              >
                Đặt lại mật khẩu
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

        <!-- No data -->
        <template #no-data>
          <div class="text-center py-8">
            <VIcon
              icon="tabler-users-off"
              size="48"
              color="disabled"
              class="mb-3"
            />
            <div class="text-body-1 text-disabled">
              Không có người dùng nào
            </div>
          </div>
        </template>
      </VDataTableServer>
    </VCard>

    <!-- Form Drawer -->
    <UserFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :user="editingUser"
      @submit="handleFormSubmit"
    />

    <!-- Reset Password Dialog -->
    <VDialog
      v-model="resetPasswordDialog.show"
      max-width="440"
    >
      <VCard>
        <VCardTitle class="pt-6 px-6">
          Đặt lại mật khẩu
        </VCardTitle>
        <VCardText class="px-6">
          <p class="mb-4 text-body-2">
            Đặt mật khẩu mới cho người dùng <strong>{{ resetPasswordDialog.userName }}</strong>
          </p>
          <AppTextField
            v-model="resetPasswordDialog.password"
            label="Mật khẩu mới"
            :type="resetPasswordDialog.isVisible ? 'text' : 'password'"
            :append-inner-icon="resetPasswordDialog.isVisible ? 'tabler-eye-off' : 'tabler-eye'"
            class="mb-3"
            @click:append-inner="resetPasswordDialog.isVisible = !resetPasswordDialog.isVisible"
          />
          <AppTextField
            v-model="resetPasswordDialog.password_confirmation"
            label="Xác nhận mật khẩu"
            :type="resetPasswordDialog.isConfirmVisible ? 'text' : 'password'"
            :append-inner-icon="resetPasswordDialog.isConfirmVisible ? 'tabler-eye-off' : 'tabler-eye'"
            @click:append-inner="resetPasswordDialog.isConfirmVisible = !resetPasswordDialog.isConfirmVisible"
          />
        </VCardText>
        <VCardActions class="px-6 pb-6">
          <VSpacer />
          <VBtn
            variant="tonal"
            color="secondary"
            @click="resetPasswordDialog.show = false"
          >
            Hủy
          </VBtn>
          <VBtn
            color="warning"
            :loading="resetPasswordDialog.isSubmitting"
            :disabled="!resetPasswordDialog.password"
            @click="submitResetPassword"
          >
            Xác nhận
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

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

    <!-- Snackbar -->
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
