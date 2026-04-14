<script setup lang="ts">
// eslint-disable-next-line import/extensions, import/no-unresolved
import { getErrorMessage } from '@/utils/errorMessage'
import { computed, ref, watch } from 'vue'
import { VForm } from 'vuetify/components/VForm'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useRoleStore } from '../stores/useRoleStore'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { usePermissionStore } from '../stores/usePermissionStore'
import type { Role } from '../services/roleApi'
// eslint-disable-next-line import/no-unresolved
import AppSnackbar from '@/components/AppSnackbar.vue'

interface Props {
  isDrawerOpen: boolean
  role?: Role | null
}

interface Emit {
  (e: 'update:isDrawerOpen', value: boolean): void
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const roleStore = useRoleStore()
const permissionStore = usePermissionStore()

const refVForm = ref<VForm>()
const isSubmitting = ref(false)
const serverErrors = ref<Record<string, string[]>>({})
const permissionSearch = ref('')

const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const formData = ref({
  name: '',
  guard_name: 'web',
  permission_ids: [] as number[],
})

const requiredRule = (v: string) => !!v?.trim() || 'Trường này là bắt buộc'

const serverErrorRule = (field: string) => () => {
  const errors = serverErrors.value[field]

  return !errors?.length || errors[0]
}

const isEditMode = computed(() => !!props.role?.id)
const drawerTitle = computed(() => isEditMode.value ? 'Cập nhật vai trò' : 'Thêm vai trò mới')

// Permission tree flattened for checkbox list
const flatPermissions = computed(() => {
  const flat: { id: number; name: string; description?: string | null; depth: number; parentId: number | null }[] = []

  const walk = (nodes: typeof permissionStore.permissionTree, depth = 0, parentId: number | null = null) => {
    for (const node of nodes) {
      flat.push({ id: node.id, name: node.name, description: node.description, depth, parentId })
      if (node.children?.length)
        walk(node.children, depth + 1, node.id)
    }
  }

  walk(permissionStore.permissionTree)

  return flat
})

// Map: groupId → direct child ids
const groupChildMap = computed(() => {
  const map = new Map<number, number[]>()

  for (const p of flatPermissions.value) {
    if (p.parentId !== null) {
      if (!map.has(p.parentId))
        map.set(p.parentId, [])
      map.get(p.parentId)!.push(p.id)
    }
  }

  return map
})

const isGroupChecked = (groupId: number) => {
  const childIds = groupChildMap.value.get(groupId) ?? []

  return childIds.length > 0 && childIds.every(id => formData.value.permission_ids.includes(id))
}

const isGroupIndeterminate = (groupId: number) => {
  const childIds = groupChildMap.value.get(groupId) ?? []
  const selected = childIds.filter(id => formData.value.permission_ids.includes(id))

  return selected.length > 0 && selected.length < childIds.length
}

const toggleGroup = (groupId: number) => {
  const childIds = groupChildMap.value.get(groupId) ?? []
  const allSelected = childIds.every(id => formData.value.permission_ids.includes(id))

  if (allSelected)
    formData.value.permission_ids = formData.value.permission_ids.filter(id => !childIds.includes(id))
  else
    formData.value.permission_ids = [...new Set([...formData.value.permission_ids, ...childIds])]
}

const filteredPermissions = computed(() => {
  const q = permissionSearch.value.toLowerCase().trim()
  if (!q)
    return flatPermissions.value

  return flatPermissions.value.filter(p => p.name.toLowerCase().includes(q))
})

const resetForm = () => {
  formData.value = { name: '', guard_name: 'web', permission_ids: [] }
  serverErrors.value = {}
  permissionSearch.value = ''
  refVForm.value?.resetValidation()
}

const populateRole = async (role: Role) => {
  if (!permissionStore.permissionTree.length)
    await permissionStore.fetchTree()

  await roleStore.fetchRole(role.id)

  const fullRole = roleStore.currentRole

  formData.value = {
    name: fullRole?.name || role.name,
    guard_name: fullRole?.guard_name || role.guard_name || 'web',
    permission_ids: [],
  }

  if (fullRole?.permissions?.length) {
    const nameToId = new Map(flatPermissions.value.map(p => [p.name, p.id]))

    formData.value.permission_ids = fullRole.permissions
      .map(name => nameToId.get(name))
      .filter((id): id is number => id !== undefined)
  }
}

const closeDrawer = () => {
  emit('update:isDrawerOpen', false)
}

const onSubmit = async () => {
  serverErrors.value = {}

  const { valid } = await refVForm.value!.validate()
  if (!valid)
    return

  isSubmitting.value = true

  try {
    const payload = {
      name: formData.value.name,
      guard_name: formData.value.guard_name || 'web',
      permission_ids: formData.value.permission_ids,
    }

    if (isEditMode.value)
      await roleStore.updateRole(props.role!.id, payload)
    else
      await roleStore.createRole(payload)

    showToast(isEditMode.value ? 'Cập nhật vai trò thành công!' : 'Thêm vai trò thành công!', 'success')
    emit('submit')
    closeDrawer()
  }
  catch (error: any) {
    if (error?.response?.status === 403) {
      showToast('Người dùng không có quyền.', 'error')
      return
    }
    const responseData = error?.response?.data
    if (responseData?.errors) {
      serverErrors.value = responseData.errors
      await refVForm.value!.validate()
      showToast('Vui lòng kiểm tra lại thông tin nhập.', 'error')
    }
    else {
      showToast(getErrorMessage(error, 'Có lỗi xảy ra, vui lòng thử lại.'), 'error')
    }
  }
  finally {
    isSubmitting.value = false
  }
}

watch(() => props.role, async role => {
  if (role)
    await populateRole(role)
  else
    resetForm()
}, { immediate: true })

watch(() => props.isDrawerOpen, async val => {
  if (!val) {
    resetForm()
  }
  else {
    if (props.role)
      await populateRole(props.role)
    else if (!permissionStore.permissionTree.length)
      await permissionStore.fetchTree()
  }
})
</script>

<template>
  <VNavigationDrawer
    :model-value="props.isDrawerOpen"
    temporary
    location="end"
    width="560"
    @update:model-value="val => emit('update:isDrawerOpen', val)"
  >
    <div class="d-flex flex-column h-100">
      <AppDrawerHeaderSection
        :title="drawerTitle"
        @cancel="closeDrawer"
      />

      <VDivider />

      <PerfectScrollbar
        :options="{ wheelPropagation: false }"
        class="flex-grow-1"
        style="overflow-y: auto;"
      >
        <VCardText>
          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- Tên vai trò -->
              <VCol cols="12">
                <AppTextField
                  v-model="formData.name"
                  label="Tên vai trò"
                  placeholder="Nhập tên vai trò"
                  :rules="[requiredRule, serverErrorRule('name')]"
                />
              </VCol>

              <!-- Guard name -->
              <VCol cols="12">
                <AppTextField
                  v-model="formData.guard_name"
                  label="Guard name"
                  placeholder="web"
                  :rules="[serverErrorRule('guard_name')]"
                />
              </VCol>

              <!-- Phân quyền -->
              <VCol cols="12">
                <div class="text-body-2 font-weight-medium mb-2">
                  Phân quyền
                  <VChip
                    size="x-small"
                    color="primary"
                    class="ms-2"
                  >
                    {{ formData.permission_ids.length }} đã chọn
                  </VChip>
                </div>

                <!-- Search permissions -->
                <AppTextField
                  v-model="permissionSearch"
                  placeholder="Tìm kiếm quyền..."
                  prepend-inner-icon="tabler-search"
                  clearable
                  density="compact"
                  class="mb-3"
                />

                <!-- Flat permission list -->
                <div
                  v-if="filteredPermissions.length === 0"
                  class="text-caption text-disabled text-center py-4"
                >
                  Không tìm thấy quyền nào
                </div>

                <VCard
                  v-else
                  variant="outlined"
                >
                  <div class="pa-1">
                    <div
                      v-for="perm in filteredPermissions"
                      :key="perm.id"
                      class="d-flex align-center rounded"
                      :class="{ 'bg-surface-variant rounded': perm.depth === 0 }"
                      :style="{ paddingLeft: `${perm.depth * 16 + 8}px` }"
                    >
                      <VCheckbox
                        v-if="perm.depth === 0"
                        :model-value="isGroupChecked(perm.id)"
                        :indeterminate="isGroupIndeterminate(perm.id)"
                        hide-details
                        density="compact"
                        @update:model-value="toggleGroup(perm.id)"
                      />
                      <VCheckbox
                        v-else
                        v-model="formData.permission_ids"
                        :value="perm.id"
                        hide-details
                        density="compact"
                      />
                      <div class="py-1">
                        <div>
                          {{ perm.name }}
                        </div>
                        <div
                          v-if="perm.description"
                          class=""
                        >
                          {{ perm.description }}
                        </div>
                      </div>
                    </div>
                  </div>
                </VCard>
              </VCol>

              <!-- Actions -->
              <VCol cols="12">
                <VBtn
                  type="submit"
                  class="me-3"
                  :loading="isSubmitting"
                >
                  {{ isEditMode ? 'Cập nhật' : 'Thêm mới' }}
                </VBtn>
                <VBtn
                  variant="tonal"
                  color="secondary"
                  @click="closeDrawer"
                >
                  Hủy
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </PerfectScrollbar>
    </div>
  </VNavigationDrawer>

  <AppSnackbar
    v-model="snackbar.show"
    :message="snackbar.message"
    :color="snackbar.color"
  />
</template>
