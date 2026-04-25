<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { VForm } from 'vuetify/components/VForm'

import { useOrganizationStore } from '../stores/useOrganizationStore'

import type { Organization } from '../services/organizationApi'
import AppSnackbar from '@/components/AppSnackbar.vue'
import { getErrorMessage } from '@/utils/errorMessage'

interface Props {
  isDrawerOpen: boolean
  organization?: Organization | null
}

interface Emit {
  (e: 'update:isDrawerOpen', value: boolean): void
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const orgStore = useOrganizationStore()

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
  status: 'active' as 'active' | 'inactive',
  parent_id: null as number | null,
  sort_order: 0,
})

const statusOptions = [
  { title: 'Hoạt động', value: 'active' },
  { title: 'Không hoạt động', value: 'inactive' },
]

const parentSelectItems = computed(() =>
  orgStore.parentOptions
    .filter(o => o.id !== props.organization?.id)
    .map(o => ({ title: o.name, value: o.id })),
)

const requiredRule = (v: string) => !!v?.trim() || 'Trường này là bắt buộc'

const serverErrorRule = (field: string) => () => {
  const errors = serverErrors.value[field]

  return !errors?.length || errors[0]
}

const isEditMode = computed(() => !!props.organization?.id)
const drawerTitle = computed(() => isEditMode.value ? 'Cập nhật tổ chức' : 'Thêm tổ chức mới')

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    status: 'active',
    parent_id: null,
    sort_order: 0,
  }
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
      status: formData.value.status,
      parent_id: formData.value.parent_id || null,
      sort_order: formData.value.sort_order,
    }

    if (isEditMode.value)
      await orgStore.updateItem(props.organization!.id, payload)
    else
      await orgStore.createItem(payload)

    showToast(isEditMode.value ? 'Cập nhật tổ chức thành công!' : 'Thêm tổ chức thành công!', 'success')
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

watch(() => props.organization, org => {
  if (org) {
    formData.value = {
      name: org.name || '',
      description: org.description || '',
      status: org.status || 'active',
      parent_id: org.parent_id || null,
      sort_order: org.sort_order ?? 0,
    }
  }
  else {
    resetForm()
  }
}, { immediate: true })

watch(() => props.isDrawerOpen, async val => {
  if (!val) {
    resetForm()
  }
  else {
    await orgStore.fetchParentOptions()

    const org = props.organization
    if (org) {
      formData.value = {
        name: org.name || '',
        description: org.description || '',
        status: org.status || 'active',
        parent_id: org.parent_id || null,
        sort_order: org.sort_order ?? 0,
      }
    }
  }
})

onMounted(() => {
  orgStore.fetchParentOptions()
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
    <AppDrawerHeaderSection
      :title="drawerTitle"
      @cancel="closeDrawer"
    />

    <VDivider />

    <PerfectScrollbar
      :options="{ wheelPropagation: false }"
      class="h-100"
    >
      <VCardText>
        <VForm
          ref="refVForm"
          @submit.prevent="onSubmit"
        >
          <VRow>
            <!-- Tên tổ chức -->
            <VCol cols="12">
              <AppTextField
                v-model="formData.name"
                label="Tên tổ chức"
                placeholder="Nhập tên tổ chức"
                :rules="[requiredRule, serverErrorRule('name')]"
              />
            </VCol>

            <!-- Mô tả -->
            <VCol cols="12">
              <AppTextarea
                v-model="formData.description"
                label="Mô tả"
                placeholder="Mô tả về tổ chức"
                rows="3"
                :rules="[serverErrorRule('description')]"
              />
            </VCol>

            <!-- Tổ chức cấp cao -->
            <VCol cols="12">
              <AppSelect
                v-model="formData.parent_id"
                label="Tổ chức cấp cao"
                placeholder="Không có tổ chức cấp cap"
                :items="parentSelectItems"
                clearable
                :rules="[serverErrorRule('parent_id')]"
              />
            </VCol>

            <!-- Trạng thái -->
            <VCol
              cols="12"
              md="6"
            >
              <AppSelect
                v-model="formData.status"
                label="Trạng thái"
                :items="statusOptions"
                :rules="[requiredRule]"
              />
            </VCol>

            <!-- Thứ tự sắp xếp -->
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model.number="formData.sort_order"
                label="Thứ tự"
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
  </VNavigationDrawer>

  <AppSnackbar
    v-model="snackbar.show"
    :message="snackbar.message"
    :color="snackbar.color"
  />
</template>
