<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import PermissionFormDrawer from '../../../components/PermissionFormDrawer.vue'
import { type Permission } from '../../../services/permissionApi'
import { usePermissionStore } from '../../../stores/usePermissionStore'
import { filterPermissionTree } from '../../../utils/permissionAdapter'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppSystemPageHeader from '@/components/AppSystemPageHeader.vue'
import { getErrorMessage } from '@/utils/errorMessage'

const permissionStore = usePermissionStore()

const isFormDrawerVisible = ref(false)
const editingPermission = ref<Permission | null>(null)
const importFileInput = ref<HTMLInputElement>()
const selectedIds = ref<Set<number>>(new Set())

const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const snackbar = ref({ show: false, message: '', color: 'success' })
const confirmDialog = ref({ show: false, title: '', message: '', onConfirm: () => {} })
const expandedGroups = ref<Set<number>>(new Set())
const isReloading = ref(false)

// Mở tất cả group khi tree load lần đầu (chỉ thêm, không đóng group user đã mở)
watchEffect(() => {
  permissionStore.permissionTree.forEach(g => expandedGroups.value.add(g.id))
})

// Debounce search query
const debouncedSearch = useDebounceFn((query: string) => {
  debouncedSearchQuery.value = query
}, 300)

watch(() => searchQuery.value, newVal => {
  debouncedSearch(newVal)
})

const hasActiveFilters = computed(() => !!debouncedSearchQuery.value)

const reloadData = async () => {
  isReloading.value = true
  try {
    await Promise.all([
      permissionStore.fetchStats(),
      permissionStore.fetchTree(),
    ])
  }
  finally {
    isReloading.value = false
  }
}

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  confirmDialog.value = { show: true, title, message, onConfirm }
}

const displayedTree = computed(() =>
  filterPermissionTree(permissionStore.permissionTree, debouncedSearchQuery.value),
)

// Cache all child IDs for select all checkbox (avoid recalculating on every render)
const allChildIds = computed(() => {
  return displayedTree.value.flatMap(g => (g.children ?? []).map(p => p.id))
})

const isAllSelected = computed(() => {
  return selectedIds.value.size > 0 && selectedIds.value.size === allChildIds.value.length
})

const isIndeterminate = computed(() => {
  return selectedIds.value.size > 0 && selectedIds.value.size < allChildIds.value.length
})

const toggleSelectAll = (val: boolean | null) => {
  selectedIds.value = val ? new Set(allChildIds.value) : new Set()
}

const toggleSelected = (id: number, checked: boolean) => {
  const next = new Set(selectedIds.value)

  checked ? next.add(id) : next.delete(id)
  selectedIds.value = next
}

const toggleGroupExpanded = (groupId: number) => {
  if (expandedGroups.value.has(groupId))
    expandedGroups.value.delete(groupId)
  else
    expandedGroups.value.add(groupId)
}

const openCreateDrawer = () => {
  editingPermission.value = null
  isFormDrawerVisible.value = true
}

const openEditDrawer = (permission: Permission) => {
  editingPermission.value = permission
  isFormDrawerVisible.value = true
}

const handleFormSubmit = async () => {
  isFormDrawerVisible.value = false
  await reloadData()
}

const handleDelete = (permission: Permission) => {
  showConfirm(
    'Xác nhận xóa',
    `Bạn có chắc muốn xóa quyền "${permission.name}"?`,
    async () => {
      try {
        await permissionStore.deletePermission(permission.id)
        selectedIds.value.delete(permission.id)
        selectedIds.value = new Set(selectedIds.value)
        showToast('Xóa quyền thành công!', 'success')
        await reloadData()
      }
      catch (err: any) {
        showToast(getErrorMessage(err, 'Xóa quyền thất bại!'), 'error')
      }
    },
  )
}

const handleBulkDelete = () => {
  if (!selectedIds.value.length)
    return

  showConfirm(
    'Xóa hàng loạt',
    `Bạn có chắc muốn xóa ${selectedIds.value.length} quyền đã chọn?`,
    async () => {
      try {
        await permissionStore.bulkDelete([...selectedIds.value])
        selectedIds.value = new Set()
        showToast('Xóa hàng loạt thành công!', 'success')
        await reloadData()
      }
      catch (err: any) {
        showToast(getErrorMessage(err, 'Xóa hàng loạt thất bại!'), 'error')
      }
    },
  )
}

const handleExport = async () => {
  try {
    await permissionStore.exportPermissions({ search: searchQuery.value || undefined })
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

  try {
    await permissionStore.fetchTree()
    showToast('Nhập dữ liệu thành công!', 'success')
    await reloadData()
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Nhập dữ liệu thất bại!'), 'error')
  }
  finally {
    if (importFileInput.value)
      importFileInput.value.value = ''
  }
}

// Search is handled by computed filteredTree, no need for watch

onMounted(async () => {
  await reloadData()
})
</script>

<template>
  <div>
    <!-- Stats -->
    <!-- System Page Header -->
    <AppSystemPageHeader
      title="Quyền hạn"
      :total="permissionStore.stats?.total ?? 0"
      :total-group="permissionStore.permissionTree?.length ?? 0"
      total-label="Tổng số quyền hạn"
      total-group-label="Tổng số nhóm quyền hạn"
      total-icon="tabler-key"
      total-group-icon="tabler-folder"
      @settings="() => {}"
    />

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
            placeholder="Nhập tên quyền hạn..."
            prepend-inner-icon="tabler-search"
            clearable
            hide-details
          />
        </VCol>
      </template>

      <template #actions>
        <VBtn
          v-if="selectedIds.size > 0"
          variant="tonal"
          color="error"
          prepend-icon="tabler-trash"
          @click="handleBulkDelete"
        >
          <span class="d-none d-sm-inline">Xóa</span>
          ({{ selectedIds.size }})
        </VBtn>

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

        <VBtn
          variant="tonal"
          color="secondary"
          @click="handleExport"
        >
          <VIcon icon="tabler-download" />
          <span class="d-none d-sm-inline ms-1">Xuất</span>
        </VBtn>

        <VBtn @click="openCreateDrawer">
          <VIcon icon="tabler-plus" />
          <span class="d-none d-sm-inline">Thêm mới</span>
        </VBtn>
      </template>

      <!-- Grouped Permission Table (default slot) -->
      <div
        v-if="displayedTree.length === 0 && !isReloading"
        class="text-center py-12"
      >
        <VIcon
          icon="tabler-key-off"
          size="48"
          color="disabled"
          class="mb-3"
        />
        <div class="text-sm text-disabled">
          Không có quyền hạn nào
        </div>
      </div>

      <VProgressLinear
        v-if="isReloading"
        indeterminate
        color="primary"
        height="3"
        class="mb-0"
      />

      <VTable
        v-if="!isReloading || displayedTree.length > 0"
        fixed-header
        class="permission-table"
        :style="isReloading ? 'opacity: 0.6' : ''"
      >
        <thead>
          <tr>
            <th style="inline-size: 48px;" />
            <th style="inline-size: 40px;">
              <VCheckbox
                :model-value="isAllSelected"
                :indeterminate="isIndeterminate"
                hide-details
                density="compact"
                @update:model-value="toggleSelectAll"
              />
            </th>
            <th>TÊN QUYỀN HẠN</th>
            <th style="inline-size: 130px; min-inline-size: 130px; text-align: start;">
              HÀNH ĐỘNG
            </th>
          </tr>
        </thead>

        <tbody>
          <template
            v-for="group in displayedTree"
            :key="group.id"
          >
            <!-- Group header row -->
            <tr
              class="group-header"
              @click="toggleGroupExpanded(group.id)"
            >
              <td class="group-expand-cell text-center">
                <VIcon
                  :icon="expandedGroups.has(group.id) ? 'tabler-chevron-down' : 'tabler-chevron-right'"
                  size="18"
                  class="group-chevron"
                />
              </td>
              <td
                colspan="2"
                class="group-content-cell"
              >
                <div class="d-flex align-center gap-3">
                  <VIcon
                    icon="tabler-folder-open"
                    size="20"
                    color="info"
                    class="group-icon"
                  />
                  <span class="group-title">{{ group.description }}</span>
                  <VChip
                    size="small"
                    color="info"
                    variant="tonal"
                    class="group-chip"
                  >
                    {{ (group.children ?? []).length }} quyền
                  </VChip>
                </div>
              </td>
              <td
                class="text-no-wrap"
                @click.stop
              >
                <div class="d-flex align-center gap-1 group-actions">
                  <IconBtn
                    size="small"
                    @click="openEditDrawer(group)"
                  >
                    <VIcon icon="tabler-edit" />
                    <VTooltip
                      activator="parent"
                      location="top"
                    >
                      Chỉnh sửa
                    </VTooltip>
                  </IconBtn>
                  <IconBtn
                    size="small"
                    color="error"
                    @click="handleDelete(group)"
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
              </td>
            </tr>

            <!-- Child permission rows (collapsible) -->
            <template v-if="expandedGroups.has(group.id)">
              <tr
                v-for="perm in (group.children ?? [])"
                :key="perm.id"
              >
                <td class="text-center text-medium-emphasis text-xs">
                  {{ perm.sort_order ?? '—' }}
                </td>
                <td>
                  <VCheckbox
                    :model-value="selectedIds.has(perm.id)"
                    hide-details
                    density="compact"
                    @update:model-value="(v) => toggleSelected(perm.id, !!v)"
                  />
                </td>
                <td>
                  <div class="d-flex align-center gap-2 py-1">
                    <VIcon
                      icon="tabler-point"
                      size="12"
                      color="disabled"
                    />
                    <div>
                      <div class="text-base font-weight-medium text-high-emphasis">
                        {{ perm.description }}
                      </div>
                      <div
                        v-if="perm.description"
                        class="text-sm font-weight-medium"
                      >
                        {{ perm.name }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="text-no-wrap">
                  <div class="d-flex align-center gap-1">
                    <IconBtn @click="openEditDrawer(perm)">
                      <VIcon icon="tabler-edit" />
                      <VTooltip
                        activator="parent"
                        location="top"
                      >
                        Chỉnh sửa
                      </VTooltip>
                    </IconBtn>
                    <IconBtn
                      color="error"
                      @click="handleDelete(perm)"
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
                </td>
              </tr>
            </template>

            <!-- Empty group (shown when no children and expanded) -->
            <tr
              v-if="!(group.children ?? []).length && expandedGroups.has(group.id)"
              :key="`${group.id}-empty`"
            >
              <td
                colspan="4"
                class="text-center text-xs text-disabled py-3"
              >
                Nhóm chưa có quyền nào
              </td>
            </tr>
          </template>
        </tbody>
      </VTable>
    </AppFilterBar>

    <!-- Form Drawer -->
    <PermissionFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :permission="editingPermission"
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
.permission-table :deep(tbody tr.group-header) {
  background: linear-gradient(90deg, rgba(33, 150, 243, 8%) 0%, rgba(33, 150, 243, 4%) 100%);
  border-inline-start: 4px solid #2196f3;
  cursor: pointer;
  transition: all 0.25s ease;
}

.permission-table :deep(tbody tr.group-header:hover) {
  background: linear-gradient(90deg, rgba(33, 150, 243, 15%) 0%, rgba(33, 150, 243, 8%) 100%);
  border-inline-start-color: #1976d2;
  box-shadow: inset 0 1px 3px rgba(33, 150, 243, 10%);
}

.permission-table :deep(.group-expand-cell) {
  background: rgba(33, 150, 243, 5%);
  color: #2196f3;
  font-weight: 600;
  inline-size: 48px !important;
  padding-block: 0.75rem !important;
  padding-inline: 0.5rem !important;
}

.permission-table :deep(.group-content-cell) {
  font-weight: 500;
  padding-block: 0.875rem !important;
  padding-inline: 1rem !important;
}

.permission-table :deep(.group-chevron) {
  color: #2196f3 !important;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.permission-table :deep(tbody tr.group-header .group-chevron) {
  font-weight: 700;
}

.permission-table :deep(.group-icon) {
  flex-shrink: 0;
  filter: drop-shadow(0 0 2px rgba(33, 150, 243, 30%));
}

.permission-table :deep(.group-title) {
  color: #1a237e;
  font-size: 0.975rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  min-inline-size: fit-content;
}

.permission-table :deep(.group-chip) {
  box-shadow: 0 2px 4px rgba(33, 150, 243, 20%) !important;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.permission-table :deep(.group-actions) {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.permission-table :deep(tbody tr.group-header:hover .group-actions) {
  opacity: 1;
}

.permission-table :deep(tbody tr) {
  transition: background-color 0.15s ease;
}

.permission-table :deep(tbody tr:not(.group-header):hover) {
  background-color: rgba(33, 150, 243, 4%) !important;
}
</style>
