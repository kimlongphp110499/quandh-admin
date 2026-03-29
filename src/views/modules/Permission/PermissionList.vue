<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PermissionFormDrawer from './PermissionFormDrawer.vue'
import { usePermissionStore } from '@/store/modules/permission'
import type { Permission } from '@/api/modules/permission'

const permissionStore = usePermissionStore()

const isFormDrawerVisible = ref(false)
const editingPermission = ref<Permission | null>(null)
const importFileInput = ref<HTMLInputElement>()
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

// Build flat list from tree for filtered display
const filteredTree = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q)
    return permissionStore.permissionTree

  // Filter: keep parent if any child matches, or parent itself matches
  const filterNodes = (nodes: Permission[]): Permission[] => {
    return nodes.reduce<Permission[]>((acc, node) => {
      const childMatches = filterNodes(node.children ?? [])

      const selfMatches = node.name.toLowerCase().includes(q)
        || (node.description ?? '').toLowerCase().includes(q)

      if (selfMatches || childMatches.length > 0)
        acc.push({ ...node, children: childMatches.length > 0 ? childMatches : (selfMatches ? (node.children ?? []) : []) })

      return acc
    }, [])
  }

  return filterNodes(permissionStore.permissionTree)
})

// Cache all child IDs for select all checkbox (avoid recalculating on every render)
const allChildIds = computed(() => {
  return filteredTree.value.flatMap(g => (g.children ?? []).map(p => p.id))
})

const isAllSelected = computed(() => {
  return selectedIds.value.length > 0 && selectedIds.value.length === allChildIds.value.length
})

const isIndeterminate = computed(() => {
  return selectedIds.value.length > 0 && selectedIds.value.length < allChildIds.value.length
})

const toggleSelectAll = (val: boolean | null) => {
  selectedIds.value = val ? [...allChildIds.value] : []
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
  await Promise.all([
    permissionStore.fetchStats(),
    permissionStore.fetchTree(),
  ])
}

const handleDelete = (permission: Permission) => {
  showConfirm(
    'Xác nhận xóa',
    `Bạn có chắc muốn xóa quyền "${permission.name}"?`,
    async () => {
      try {
        await permissionStore.deletePermission(permission.id)
        selectedIds.value = selectedIds.value.filter(id => id !== permission.id)
        showToast('Xóa quyền thành công!', 'success')
        await Promise.all([permissionStore.fetchStats(), permissionStore.fetchTree()])
      }
      catch {
        showToast('Xóa quyền thất bại!', 'error')
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
        await permissionStore.bulkDelete(selectedIds.value)
        selectedIds.value = []
        showToast('Xóa hàng loạt thành công!', 'success')
        await Promise.all([permissionStore.fetchStats(), permissionStore.fetchTree()])
      }
      catch {
        showToast('Xóa hàng loạt thất bại!', 'error')
      }
    },
  )
}

const handleExport = async () => {
  try {
    await permissionStore.exportPermissions({ search: searchQuery.value || undefined })
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

  try {
    await permissionStore.fetchTree()
    showToast('Nhập dữ liệu thành công!', 'success')
    await Promise.all([permissionStore.fetchStats(), permissionStore.fetchTree()])
  }
  catch {
    showToast('Nhập dữ liệu thất bại!', 'error')
  }
  finally {
    if (importFileInput.value)
      importFileInput.value.value = ''
  }
}

// Search is handled by computed filteredTree, no need for watch

onMounted(async () => {
  await Promise.all([permissionStore.fetchStats(), permissionStore.fetchTree()])
})
</script>

<template>
  <div>
    <!-- Stats -->
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
                icon="tabler-key"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ permissionStore.stats?.total ?? 0 }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Tổng số quyền hạn
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
              color="info"
              variant="tonal"
              size="48"
              rounded
            >
              <VIcon
                icon="tabler-folder"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ permissionStore.permissionTree?.length ?? 0 }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Tổng số nhóm quyền hạn
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
          placeholder="Tìm kiếm quyền hạn..."
          prepend-inner-icon="tabler-search"
          clearable
          style="min-inline-size: 280px; max-inline-size: 360px;"
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

    <!-- Grouped Permission Table -->
    <VCard
      elevation="0"
      border
    >
      <div
        v-if="permissionStore.isLoading"
        class="d-flex justify-center align-center py-12"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>

      <div
        v-else-if="filteredTree.length === 0"
        class="text-center py-12"
      >
        <VIcon
          icon="tabler-key-off"
          size="48"
          color="disabled"
          class="mb-3"
        />
        <div class="text-body-1 text-disabled">
          Không có quyền hạn nào
        </div>
      </div>

      <VTable
        v-else
        fixed-header
      >
        <thead>
          <tr>
            <th style="width: 48px;" />
            <th style="width: 40px;">
              <VCheckbox
                :model-value="isAllSelected"
                :indeterminate="isIndeterminate"
                hide-details
                density="compact"
                @update:model-value="toggleSelectAll"
              />
            </th>
            <th>TÊN QUYỀN HẠN</th>
            <th style="width: 220px;">
              THUỘC VAI TRÒ
            </th>
            <th style="width: 160px;">
              NGÀY TẠO
            </th>
            <th style="width: 100px;">
              HÀNH ĐỘNG
            </th>
          </tr>
        </thead>

        <tbody>
          <template
            v-for="group in filteredTree"
            :key="group.id"
          >
            <!-- Group header row -->
            <tr class="bg-surface-variant">
              <td
                colspan="6"
                class="py-2 px-4"
              >
                <div class="d-flex align-center gap-2">
                  <VIcon
                    icon="tabler-folder"
                    size="16"
                    color=""
                  />
                  <span class="font-weight-semibold">{{ group.description }}</span>
                  <VChip
                    size="x-small"
                    color="success"
                    variant="tonal"
                  >
                    {{ (group.children ?? []).length }} quyền
                  </VChip>
                  <VSpacer />
                  <div class="d-flex align-center gap-1">
                    <IconBtn
                      size="small"
                      @click="openEditDrawer(group)"
                    >
                      <VIcon
                        icon="tabler-edit"
                        size="16"
                      />
                      <VTooltip
                        activator="parent"
                        location="top"
                      >
                        Chỉnh sửa nhóm
                      </VTooltip>
                    </IconBtn>
                    <IconBtn
                      size="small"
                      color="error"
                      @click="handleDelete(group)"
                    >
                      <VIcon
                        icon="tabler-trash"
                        size="16"
                      />
                      <VTooltip
                        activator="parent"
                        location="top"
                      >
                        Xóa nhóm
                      </VTooltip>
                    </IconBtn>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Child permission rows -->
            <tr
              v-for="perm in (group.children ?? [])"
              :key="perm.id"
            >
              <td class="text-center text-medium-emphasis text-caption">
                {{ perm.sort_order ?? '—' }}
              </td>
              <td>
                <VCheckbox
                  v-model="selectedIds"
                  :value="perm.id"
                  hide-details
                  density="compact"
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
                    <div class="text-body-2 font-weight-medium">
                      {{ perm.name }}
                    </div>
                    <div
                      v-if="perm.description"
                      class="text-caption text-disabled"
                    >
                      {{ perm.description }}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div
                  v-if="perm.roles && perm.roles.length"
                  class="d-flex flex-wrap gap-1 py-1"
                >
                  <VChip
                    v-for="role in perm.roles"
                    :key="role.id"
                    size="x-small"
                    color="primary"
                    variant="tonal"
                  >
                    {{ role.name }}
                  </VChip>
                </div>
                <span
                  v-else
                  class="text-caption text-disabled"
                >—</span>
              </td>
              <td class="text-body-2 text-medium-emphasis">
                {{ perm.created_at }}
              </td>
              <td>
                <div class="d-flex align-center gap-1">
                  <IconBtn
                    size="small"
                    @click="openEditDrawer(perm)"
                  >
                    <VIcon
                      icon="tabler-edit"
                      size="18"
                    />
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
                    @click="handleDelete(perm)"
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
              </td>
            </tr>

            <!-- Empty group -->
            <tr
              v-if="!(group.children ?? []).length"
              :key="`${group.id}-empty`"
            >
              <td
                colspan="6"
                class="text-center text-caption text-disabled py-3"
              >
                Nhóm chưa có quyền nào
              </td>
            </tr>
          </template>
        </tbody>
      </VTable>
    </VCard>

    <!-- Form Drawer -->
    <PermissionFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :permission="editingPermission"
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
