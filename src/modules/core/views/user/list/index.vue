<script setup lang="ts">
import { getErrorMessage } from '@/utils/errorMessage'
import { computed, onMounted, ref, watch } from 'vue'

import UserFormDrawer from '../../../components/UserFormDrawer.vue'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSystemPageHeader from '@/components/AppSystemPageHeader.vue'
import { useUserStore } from '../../../stores/useUserStore'
import { useAuthStore } from '@/store/modules/auth'
import AppUserDateInfo from '@/components/AppUserDateInfo.vue'
import type { User } from '../../../services/userApi'
import { USER_STATUS_OPTIONS } from '../../../utils/userAdapters'
import { USER_TABLE_HEADERS } from '../../../configs/userOptions'

const userStore = useUserStore()
const authStore = useAuthStore()

// State
const isFormDrawerVisible = ref(false)
const editingUser = ref<User | null>(null)
const drawerKey = ref(0)
const selectedIds = ref<number[]>([])
const importFileInput = ref<HTMLInputElement>()

// Filters
const searchQuery = ref('')
const statusFilter = ref<string | null>(null)

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

// Confirm dialog
const confirmDialog = ref({ show: false, title: '', message: '', onConfirm: () => {}, loading: false })

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  confirmDialog.value = { show: true, title, message, onConfirm, loading: false }
}

// Active filters check for filter badge
const hasActiveFilters = computed(() =>
  !!searchQuery.value || !!statusFilter.value,
)

const headers = USER_TABLE_HEADERS

const avatarColor = (id: number) => {
  const colors = ['primary', 'info', 'success', 'warning', 'error', 'secondary']
  return colors[id % colors.length]
}

const getUserInitials = (name: string) => {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const statusLabel = (status: string) => {
  if (status === 'active') return 'Hoạt động'
  return 'Không hoạt động'
}

// Load data
const loadUsers = async () => {
  await userStore.fetchItems({
    page: userStore.filters.page,
    limit: userStore.filters.limit,
    search: searchQuery.value || undefined,
    status: (statusFilter.value as any) ?? undefined,
    sort_by: userStore.filters.sort_by,
    sort_order: userStore.filters.sort_order,
  })
}

const handleTableUpdate = (options: any) => {
  const sortBy = options.sortBy?.[0]
  const newSortBy = sortBy?.key as any || 'created_at'
  const newSortOrder = sortBy?.order || 'desc'

  if (newSortBy !== userStore.filters.sort_by || newSortOrder !== userStore.filters.sort_order) {
    userStore.setFilters({ sort_by: newSortBy, sort_order: newSortOrder })
    loadUsers()
  }
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

watch([statusFilter], () => {
  userStore.setFilters({ page: 1 })
  loadUsers()
})

// Reset filters
const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = null
  userStore.resetFilters()
  loadUsers()
}

// Form actions
const openCreateDrawer = () => {
  editingUser.value = null
  drawerKey.value++
  isFormDrawerVisible.value = true
}

const openEditDrawer = (user: User) => {
  editingUser.value = user
  drawerKey.value++
  isFormDrawerVisible.value = true
}

const handleFormSubmit = async () => {
  await Promise.all([loadUsers(), userStore.fetchStats()])
}

// Delete
const handleDelete = (user: User) => {
  showConfirm(
    'Xác nhận xóa',
    `Bạn có chắc muốn xóa người dùng "${user.name}"? Hành động này không thể hoàn tác.`,
    async () => {
      try {
        await userStore.deleteItem(user.id)
        showToast('Xóa người dùng thành công!', 'success')
        await Promise.all([loadUsers(), userStore.fetchStats()])
      }
      catch (err: any) {
        showToast(getErrorMessage(err, 'Xóa người dùng thất bại!'), 'error')
      }
    },
  )
}

// Bulk actions
const handleBulkStatus = (status: 'active' | 'inactive') => {
  if (!selectedIds.value.length) return

  const label = status === 'active' ? 'hoạt động' : 'không hoạt động'

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
      catch (err: any) {
        showToast(getErrorMessage(err, 'Cập nhật trạng thái thất bại!'), 'error')
      }
    },
  )
}

const handleBulkDelete = () => {
  if (!selectedIds.value.length) return

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
      catch (err: any) {
        showToast(getErrorMessage(err, 'Xóa hàng loạt thất bại!'), 'error')
      }
    },
  )
}

// Export
const handleExport = async () => {
  try {
    await userStore.exportItems({
      search: searchQuery.value || undefined,
      status: (statusFilter.value as any) || undefined,
    })
    showToast('Xuất dữ liệu thành công!', 'success')
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Xuất dữ liệu thất bại!'), 'error')
  }
}

// Import
const handleImportClick = () => {
  importFileInput.value?.click()
}

const handleImportFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    await userStore.importItems(file)
    showToast('Nhập dữ liệu thành công!', 'success')
    await Promise.all([loadUsers(), userStore.fetchStats()])
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Nhập dữ liệu thất bại!'), 'error')
  }
  finally {
    if (importFileInput.value)
      importFileInput.value.value = ''
  }
}

const statusToggleId = ref<number | null>(null)

const handleToggleStatus = (user: User) => {
  if (user.id === authStore.user?.id) return

  const newStatus = user.status === 'active' ? 'inactive' : 'active'

  showConfirm(
    'Xác nhận thay đổi trạng thái',
    `Bạn có chắc muốn đổi trạng thái của người dùng "${user.name}" từ "${statusLabel(user.status)}" sang "${statusLabel(newStatus)}"?`,
    async () => {
      try {
        statusToggleId.value = user.id
        await userStore.changeStatus(user.id, newStatus)
        showToast('Cập nhật trạng thái thành công!', 'success')
        await Promise.all([loadUsers(), userStore.fetchStats()])
      }
      catch (err: any) {
        showToast(getErrorMessage(err, 'Cập nhật trạng thái thất bại!'), 'error')
      }
      finally {
        statusToggleId.value = null
      }
    },
  )
}

onMounted(async () => {
  await Promise.all([userStore.fetchStats(), loadUsers()])
})
</script>

<template>
  <div>
    <!-- System Page Header -->
    <AppSystemPageHeader
      title="Người dùng"
      :total="userStore.stats?.total ?? 0"
      :active="userStore.stats?.active ?? 0"
      :inactive="userStore.stats?.inactive ?? 0"
      total-label="Tổng người dùng"
      active-label="Đang hoạt động"
      inactive-label="Không hoạt động"
      total-icon="tabler-users"
      active-icon="tabler-user-check"
      inactive-icon="tabler-user-off"
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
            placeholder="Nhập tên, email..."
            prepend-inner-icon="tabler-search"
            clearable
            hide-details
          />
        </VCol>

        <!-- Status filter -->
        <VCol
          cols="12"
          sm="6"
          md="6"
        >
          <AppSelect
            v-model="statusFilter"
            :items="USER_STATUS_OPTIONS"
            placeholder="Chọn trạng thái"
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
            @click="handleBulkDelete"
          >
            <span class="d-none d-sm-inline">Xóa</span>
            ({{ selectedIds.length }})
          </VBtn>
        </template>

        <!-- Import -->
        <VBtn
          variant="tonal"
          color="secondary"
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

        <!-- Export -->
        <VBtn
          variant="tonal"
          color="secondary"
          @click="handleExport"
        >
          <VIcon icon="tabler-download" />
          <span class="d-none d-sm-inline ms-1">Xuất</span>
        </VBtn>

        <!-- Add new -->
        <VBtn @click="openCreateDrawer">
          <VIcon icon="tabler-plus" />
          <span class="d-none d-sm-inline ms-1">Thêm mới</span>
        </VBtn>
      </template>

      <!-- Table -->
      <VDataTableServer
        v-model="selectedIds"
        :headers="headers"
        :items="userStore.items"
        :items-length="userStore.total"
        :items-per-page="userStore.filters.limit || 10"
        :page="userStore.filters.page || 1"
        item-value="id"
        item-height="64"
        show-select
        @update:options="handleTableUpdate"
      >
        <!-- STT -->
        <template #item.stt="{ index }">
          <span class="text-body-1 text-high-emphasis">
            {{ ((userStore.filters.page || 1) - 1) * (userStore.filters.limit || 10) + index + 1 }}
          </span>
        </template>

        <!-- Name + username -->
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-x-4">
            <VAvatar
              :color="avatarColor(item.id)"
              variant="tonal"
              size="34"
              rounded
            >
              <span class="text-sm font-weight-bold">{{ getUserInitials(item.name) }}</span>
            </VAvatar>
            <div class="d-flex flex-column">
              <h6 class="text-base font-weight-medium text-high-emphasis">
                {{ item.name }}
              </h6>
            </div>
          </div>
        </template>

        <!-- Email -->
        <template #item.email="{ item }">
          <span class="text-body-1 text-high-emphasis">{{ item.email }}</span>
        </template>

        <!-- Assignments -->
        <template #item.assignments="{ item }">
          <div
            v-if="item.assignments && item.assignments.length > 0"
            class="d-flex flex-column gap-1 py-1"
          >
            <div
              v-for="(assignment, idx) in item.assignments"
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
                v-for="org in (assignment.organizations ?? [])"
                :key="org.id"
                size="x-small"
                color="info"
                variant="tonal"
                prepend-icon="tabler-building"
              >
                {{ org.name }}
              </VChip>
            </div>
          </div>
          <span
            v-else
            class="text-disabled text-xs"
          >Chưa phân công</span>
        </template>

        <!-- Status -->
        <template #item.status="{ item }">
          <VSwitch
            :model-value="item.status === 'active'"
            inset
            hide-details
            density="compact"
            :disabled="item.id === authStore.user?.id || statusToggleId === item.id"
            :loading="statusToggleId === item.id"
            @update:model-value="handleToggleStatus(item)"
          />
        </template>

        <!-- Created at -->
        <template #item.created_at="{ item }">
          <div style="max-width: 160px; overflow: hidden;">
            <AppUserDateInfo
              :user="item.created_by"
              :date="item.created_at"
            />
          </div>
        </template>

        <!-- Updated at -->
        <template #item.updated_at="{ item }">
          <div style="max-width: 160px; overflow: hidden;">
            <AppUserDateInfo
              :user="item.updated_by"
              :date="item.updated_at"
            />
          </div>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <template v-if="item.id !== authStore.user?.id">
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

                  <VListItem @click="handleToggleStatus(item)">
                    <template #prepend>
                      <VIcon :icon="item.status === 'active' ? 'tabler-toggle-right' : 'tabler-toggle-left'" />
                    </template>
                    <VListItemTitle>
                      {{ item.status === 'active' ? 'Tắt hoạt động' : 'Bật hoạt động' }}
                    </VListItemTitle>
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
          <span
            v-else
            class="text-body-2 text-disabled"
          >—</span>
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
            <div class="text-sm text-disabled">
              Không có người dùng nào
            </div>
          </div>
        </template>

        <template #bottom>
          <AppPagination
            :page="userStore.filters.page || 1"
            :limit="userStore.filters.limit || 15"
            :total="userStore.total"
            :limit-options="[10, 15, 20, 50, 100]"
            :loading="userStore.isLoading"
            @update:page="(p) => { userStore.setFilters({ page: p }); loadUsers() }"
            @update:limit="(l) => { userStore.setFilters({ limit: l, page: 1 }); loadUsers() }"
          />
        </template>
      </VDataTableServer>
    </AppFilterBar>

    <!-- Form Drawer -->
    <UserFormDrawer
      :key="drawerKey"
      v-model:is-drawer-open="isFormDrawerVisible"
      :user="editingUser"
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
