<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as yup from 'yup'

import { useItemTypeStore } from '../stores/useItemTypeStore'

import type { ItemType, ItemTypeFormData } from '../services/itemTypeApi'
import { ITEM_TYPE_STATUS_OPTIONS } from '../configs/itemTypeOptions'
import AppSnackbar from '@/components/AppSnackbar.vue'
import { getErrorMessage } from '@/utils/errorMessage'

interface Props {
  isDrawerOpen: boolean
  itemType?: ItemType | null
}

interface Emit {
  (e: 'update:isDrawerOpen', value: boolean): void
  (e: 'submit'): void
}

const props = withDefaults(defineProps<Props>(), {
  itemType: null,
})

const emit = defineEmits<Emit>()

const store = useItemTypeStore()

const isSubmitting = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const formData = ref<ItemTypeFormData>({
  name: '',
  description: '',
  status: 'active',
})

const fieldErrors = ref<Record<string, string>>({})

const statusOptions = ITEM_TYPE_STATUS_OPTIONS

const isEditMode = computed(() => !!props.itemType?.id)
const drawerTitle = computed(() => isEditMode.value ? 'Chỉnh sửa loại công việc' : 'Thêm loại công việc mới')

const schema = yup.object({
  name: yup.string().required('Tên loại công việc là bắt buộc'),
  description: yup.string().nullable(),
  status: yup.string().required('Trạng thái là bắt buộc'),
})

const validateForm = async (): Promise<boolean> => {
  fieldErrors.value = {}
  try {
    await schema.validate(formData.value, { abortEarly: false })

    return true
  }
  catch (err: any) {
    if (err instanceof yup.ValidationError) {
      err.inner.forEach(e => {
        if (e.path)
          fieldErrors.value[e.path] = e.message
      })
    }

    return false
  }
}

const resetForm = () => {
  formData.value = { name: '', description: '', status: 'active' }
  fieldErrors.value = {}
}

const closeDrawer = () => {
  emit('update:isDrawerOpen', false)
}

const onSubmit = async () => {
  const valid = await validateForm()
  if (!valid)
    return

  isSubmitting.value = true

  try {
    if (isEditMode.value && props.itemType)
      await store.updateItemType(props.itemType.id, formData.value)
    else
      await store.createItemType(formData.value)

    showToast(isEditMode.value ? 'Cập nhật loại công việc thành công!' : 'Thêm loại công việc thành công!', 'success')
    emit('submit')
    closeDrawer()
  }
  catch (error: any) {
    if (error?.response?.status === 403) {
      showToast('Người dùng không có quyền.', 'error')

      return
    }
    const responseErrors = error?.response?.data?.errors
    if (responseErrors) {
      Object.keys(responseErrors).forEach(field => {
        fieldErrors.value[field] = Array.isArray(responseErrors[field])
          ? responseErrors[field][0]
          : responseErrors[field]
      })
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

watch(() => props.itemType, type => {
  if (type) {
    formData.value = {
      name: type.name || '',
      description: type.description || '',
      status: type.status || 'active',
    }
  }
  else {
    resetForm()
  }
}, { immediate: true })

watch(() => props.isDrawerOpen, val => {
  if (!val)
    resetForm()
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
        <VForm @submit.prevent="onSubmit">
          <VRow>
            <!-- Tên loại công việc -->
            <VCol cols="12">
              <AppTextField
                v-model="formData.name"
                label="Tên loại công việc"
                placeholder="Nhập tên loại công việc"
                :error-messages="fieldErrors.name"
                @update:model-value="fieldErrors.name = ''"
              />
            </VCol>

            <!-- Mô tả -->
            <VCol cols="12">
              <AppTextarea
                v-model="formData.description"
                label="Mô tả"
                placeholder="Nhập mô tả"
                rows="3"
                :error-messages="fieldErrors.description"
                @update:model-value="fieldErrors.description = ''"
              />
            </VCol>

            <!-- Trạng thái -->
            <VCol cols="12">
              <AppSelect
                v-model="formData.status"
                label="Trạng thái"
                :items="statusOptions"
                :error-messages="fieldErrors.status"
                @update:model-value="fieldErrors.status = ''"
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
