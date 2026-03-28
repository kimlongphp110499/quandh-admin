<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { VForm } from 'vuetify/components/VForm'
import { usePermissionStore } from '@/store/modules/permission'
import type { Permission } from '@/api/modules/permission'

interface Props {
  isDrawerOpen: boolean
  permission?: Permission | null
}

interface Emit {
  (e: 'update:isDrawerOpen', value: boolean): void
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const permissionStore = usePermissionStore()

const refVForm = ref<VForm>()
const isSubmitting = ref(false)
const serverErrors = ref<Record<string, string[]>>({})

const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const formData = ref({
  name: '',
  description: '' as string | null,
  sort_order: 0,
  parent_id: null as number | null,
})

const parentOptions = computed(() => {
  const flat: { title: string; value: number | null }[] = [{ title: '-- Không có (quyền gốc) --', value: null }]

  const walk = (nodes: typeof permissionStore.permissionTree, depth = 0) => {
    for (const node of nodes) {
      if (node.id !== props.permission?.id) {
        flat.push({
          title: `${'　'.repeat(depth)}${node.name}`,
          value: node.id,
        })
        if (node.children?.length)
          walk(node.children, depth + 1)
      }
    }
  }

  walk(permissionStore.permissionTree)

  return flat
})

const requiredRule = (v: string) => !!v?.trim() || 'Trường này là bắt buộc'

const serverErrorRule = (field: string) => () => {
  const errors = serverErrors.value[field]

  return !errors?.length || errors[0]
}

const isEditMode = computed(() => !!props.permission?.id)
const drawerTitle = computed(() => isEditMode.value ? 'Cập nhật quyền hạn' : 'Thêm quyền hạn mới')

const resetForm = () => {
  formData.value = { name: '', description: '', sort_order: 0, parent_id: null }
  serverErrors.value = {}
  refVForm.value?.resetValidation()
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
      description: formData.value.description || null,
      sort_order: formData.value.sort_order,
      parent_id: formData.value.parent_id || null,
    }

    if (isEditMode.value)
      await permissionStore.updatePermission(props.permission!.id, payload)
    else
      await permissionStore.createPermission(payload)

    showToast(isEditMode.value ? 'Cập nhật quyền thành công!' : 'Thêm quyền thành công!', 'success')
    emit('submit')
    closeDrawer()
  }
  catch (error: any) {
    const responseData = error?.response?.data
    if (responseData?.errors) {
      serverErrors.value = responseData.errors
      await refVForm.value!.validate()
      showToast('Vui lòng kiểm tra lại thông tin nhập.', 'error')
    }
    else {
      showToast(responseData?.message || 'Có lỗi xảy ra, vui lòng thử lại.', 'error')
    }
  }
  finally {
    isSubmitting.value = false
  }
}

watch(() => props.permission, perm => {
  if (perm) {
    formData.value = {
      name: perm.name || '',
      description: perm.description || '',
      sort_order: perm.sort_order ?? 0,
      parent_id: perm.parent_id || null,
    }
  }
  else {
    resetForm()
  }
}, { immediate: true })

watch(() => props.isDrawerOpen, async val => {
  if (!val)
    resetForm()
  else if (!permissionStore.permissionTree.length)
    await permissionStore.fetchTree()
})
</script>

<template>
  <VNavigationDrawer
    :model-value="props.isDrawerOpen"
    temporary
    location="end"
    width="480"
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
              <!-- Tên quyền -->
              <VCol cols="12">
                <AppTextField
                  v-model="formData.name"
                  label="Tên quyền"
                  placeholder="vd: users.index"
                  :rules="[requiredRule, serverErrorRule('name')]"
                />
              </VCol>

              <!-- Mô tả -->
              <VCol cols="12">
                <AppTextarea
                  v-model="formData.description"
                  label="Mô tả"
                  placeholder="Mô tả về quyền này"
                  rows="2"
                  :rules="[serverErrorRule('description')]"
                />
              </VCol>

              <!-- Quyền cha -->
              <VCol cols="12">
                <AppSelect
                  v-model="formData.parent_id"
                  label="Nhóm quyền cha"
                  :items="parentOptions"
                  clearable
                  :rules="[serverErrorRule('parent_id')]"
                />
              </VCol>

              <!-- Thứ tự -->
              <VCol cols="12">
                <AppTextField
                  v-model.number="formData.sort_order"
                  label="Thứ tự sắp xếp"
                  type="number"
                  placeholder="0"
                  :rules="[serverErrorRule('sort_order')]"
                />
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
</template>
