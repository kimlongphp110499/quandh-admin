<script setup lang="ts">
// eslint-disable-next-line import/extensions, import/no-unresolved
import { getErrorMessage } from '@/utils/errorMessage'
import { computed, onMounted, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import PermissionFormDrawer from './PermissionFormDrawer.vue'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import AppSnackbar from '@/components/AppSnackbar.vue'
import { type Permission, permissionApi } from '@/api/modules/permission'
import { type Role, roleApi } from '@/api/modules/role'
import { usePermissionStore } from '@/store/modules/permission'
import AppSystemPageHeader from '@/components/AppSystemPageHeader.vue'

const permissionStore = usePermissionStore()

const isFormDrawerVisible = ref(false)
const editingPermission = ref<Permission | null>(null)
const importFileInput = ref<HTMLInputElement>()
const selectedIds = ref<number[]>([])

const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const snackbar = ref({ show: false, message: '', color: 'success' })
const confirmDialog = ref({ show: false, title: '', message: '', onConfirm: () => {} })
const expandedGroups = ref<Set<number>>(new Set())
const createdAtByPermissionId = ref<Record<number, string>>({})
const rolesByPermissionId = ref<Record<number, { id: number; name: string }[]>>({})

// Debounce search query
const debouncedSearch = useDebounceFn((query: string) => {
  debouncedSearchQuery.value = query
}, 300)

watch(() => searchQuery.value, newVal => {
  debouncedSearch(newVal)
})

const hasActiveFilters = computed(() => !!debouncedSearchQuery.value)

const normalizeName = (value: string) => value.trim().toLowerCase()

const fetchAllRoles = async () => {
  const all: Role[] = []
  let page = 1
  let lastPage = 1
  const limit = 100

  do {
    const response = await roleApi.list({ page, limit, sort_by: 'id', sort_order: 'asc' })
    if (!response.data.success)
      break

    all.push(...(response.data.data || []))
    lastPage = response.data.meta?.last_page ?? 1
    page += 1
  } while (page <= lastPage)

  return all
}

const flattenPermissionIds = (nodes: Permission[]): number[] => {
  return nodes.flatMap(node => {
    const childIds = flattenPermissionIds(node.children ?? [])

    return [node.id, ...childIds]
  })
}

const fetchPermissionDetails = async () => {
  const ids = Array.from(new Set(flattenPermissionIds(permissionStore.permissionTree)))

  const responses = await Promise.all(ids.map(async id => {
    try {
      const response = await permissionApi.show(id)

      return response.data.success ? response.data.data : null
    }
    catch {
      return null
    }
  }))

  return responses.filter((item): item is Permission => !!item)
}

const extractRolePermissionNames = (role: Role): string[] => {
  const rolePermissions = role.permissions as unknown
  if (!Array.isArray(rolePermissions))
    return []

  return rolePermissions
    .map(permission => {
      if (typeof permission === 'string')
        return permission

      if (permission && typeof permission === 'object' && 'name' in permission) {
        const name = (permission as { name?: unknown }).name

        return typeof name === 'string' ? name : ''
      }

      return ''
    })
    .filter(Boolean)
}

const hydratePermissionExtraData = async () => {
  const [permissions, roles] = await Promise.all([fetchPermissionDetails(), fetchAllRoles()])

  const createdAtMap: Record<number, string> = {}
  const permissionNameToIds = new Map<string, number[]>()
  const roleMapByPermissionId = new Map<number, Map<number, { id: number; name: string }>>()

  const addRoleForPermission = (permissionId: number, role: { id: number; name: string }) => {
    const roleMap = roleMapByPermissionId.get(permissionId) ?? new Map<number, { id: number; name: string }>()

    roleMap.set(role.id, role)
    roleMapByPermissionId.set(permissionId, roleMap)
  }

  permissions.forEach(permission => {
    if (permission.created_at)
      createdAtMap[permission.id] = permission.created_at

    const key = normalizeName(permission.name)
    const ids = permissionNameToIds.get(key) ?? []

    ids.push(permission.id)
    permissionNameToIds.set(key, ids)

    ;(permission.roles ?? []).forEach(role => addRoleForPermission(permission.id, role))
  })

  roles.forEach(role => {
    extractRolePermissionNames(role).forEach(permissionName => {
      const ids = permissionNameToIds.get(normalizeName(permissionName)) ?? []

      ids.forEach(permissionId => addRoleForPermission(permissionId, { id: role.id, name: role.name }))
    })
  })

  const rolesMap: Record<number, { id: number; name: string }[]> = {}

  roleMapByPermissionId.forEach((roleMap, permissionId) => {
    rolesMap[permissionId] = Array.from(roleMap.values())
  })

  createdAtByPermissionId.value = createdAtMap
  rolesByPermissionId.value = rolesMap
}

const reloadData = async () => {
  await Promise.all([
    permissionStore.fetchStats(),
    permissionStore.fetchTree(),
  ])
  await hydratePermissionExtraData()
}

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  confirmDialog.value = { show: true, title, message, onConfirm }
}

// Build flat list from tree for filtered display (with debounced search)
const filteredTree = computed(() => {
  const q = debouncedSearchQuery.value.toLowerCase().trim()
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

const displayedTree = computed(() => {
  const enrich = (nodes: Permission[]): Permission[] => {
    return nodes.map(node => {
      const children = node.children ? enrich(node.children) : node.children

      return {
        ...node,
        children,
        created_at: createdAtByPermissionId.value[node.id] ?? node.created_at,
        roles: rolesByPermissionId.value[node.id] ?? node.roles,
      }
    })
  }

  return enrich(filteredTree.value)
})

// Cache all child IDs for select all checkbox (avoid recalculating on every render)
const allChildIds = computed(() => {
  return displayedTree.value.flatMap(g => (g.children ?? []).map(p => p.id))
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
        selectedIds.value = selectedIds.value.filter(id => id !== permission.id)
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
        await permissionStore.bulkDelete(selectedIds.value)
        selectedIds.value = []
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
        <div style="min-inline-size: 280px; flex: 1; max-inline-size: 100%">
          <div class="text-caption text-medium-emphasis mb-1">
            Tìm kiếm quyền hạn
          </div>
          <AppTextField
            v-model="searchQuery"
            placeholder="Nhập tên quyền hạn..."
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
    </AppFilterBar>

    <!-- Grouped Permission Table -->
    <VCard
      elevation="0"
      border
    >
      <div
        v-if="displayedTree.length === 0"
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
        class="permission-table"
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
            <th style="width: 160px; min-width: 160px;">
              NGÀY TẠO
            </th>
            <th style="width: 130px; min-width: 130px; text-align: left;">
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
                colspan="4"
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
                    <VIcon
                      icon="tabler-edit"
                      size="18"
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
                      size="18"
                    />
                    <VTooltip
                      activator="parent"
                      location="top"
                    >
                      Xóa nhóm
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
                <td class="text-no-wrap">
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
            </template>

            <!-- Empty group (shown when no children and expanded) -->
            <tr
              v-if="!(group.children ?? []).length && expandedGroups.has(group.id)"
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
  cursor: pointer;
  transition: all 0.25s ease;
  background: linear-gradient(90deg, rgba(33, 150, 243, 0.08) 0%, rgba(33, 150, 243, 0.04) 100%);
  border-left: 4px solid #2196f3;
}

.permission-table :deep(tbody tr.group-header:hover) {
  background: linear-gradient(90deg, rgba(33, 150, 243, 0.15) 0%, rgba(33, 150, 243, 0.08) 100%);
  border-left-color: #1976d2;
  box-shadow: inset 0 1px 3px rgba(33, 150, 243, 0.1);
}

.permission-table :deep(.group-expand-cell) {
  width: 48px !important;
  padding: 0.75rem 0.5rem !important;
  font-weight: 600;
  color: #2196f3;
  background: rgba(33, 150, 243, 0.05);
}

.permission-table :deep(.group-content-cell) {
  padding: 0.875rem 1rem !important;
  font-weight: 500;
}

.permission-table :deep(.group-chevron) {
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  color: #2196f3 !important;
}

.permission-table :deep(tbody tr.group-header .group-chevron) {
  font-weight: 700;
}

.permission-table :deep(.group-icon) {
  flex-shrink: 0;
  filter: drop-shadow(0 0 2px rgba(33, 150, 243, 0.3));
}

.permission-table :deep(.group-title) {
  font-size: 0.975rem;
  font-weight: 600;
  color: #1a237e;
  letter-spacing: 0.3px;
  min-width: fit-content;
}

.permission-table :deep(.group-chip) {
  font-weight: 700;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2) !important;
}

.permission-table :deep(.group-actions) {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.permission-table :deep(tbody tr:not(.group-header)) {
  height: 64px;
}

.permission-table :deep(tbody tr.group-header:hover .group-actions) {
  opacity: 1;
}

.permission-table :deep(tbody tr) {
  transition: background-color 0.15s ease;
}

.permission-table :deep(tbody tr:not(.group-header):hover) {
  background-color: rgba(33, 150, 243, 0.04) !important;
}
</style>
