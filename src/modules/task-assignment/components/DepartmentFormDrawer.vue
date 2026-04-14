<script setup lang="ts">
import { getErrorMessage } from '@/utils/errorMessage'
import { computed, ref, watch } from 'vue'
import * as yup from 'yup'
import { useDepartmentStore } from '../stores/useDepartmentStore'
import type { Department, DepartmentFormData } from '../services/departmentApi'

import AppSnackbar from '@/components/AppSnackbar.vue'

interface Props {
  isDrawerOpen: boolean
  department?: Department | null
}

interface Emit {
  (e: 'update:isDrawerOpen', value: boolean): void
  (e: 'submit'): void
}

const props = withDefaults(defineProps<Props>(), {
  department: null,
})

const emit = defineEmits<Emit>()

const store = useDepartmentStore()

const isSubmitting = ref(false)

const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const formData = ref<DepartmentFormData>({
  code: '',
  name: '',
  description: '',
  status: 'active',
  sort_order: 0,
})

const fieldErrors = ref<Record<string, string>>({})

const statusOptions = [
  { title: 'Hoạt động', value: 'active' },
  { title: 'Không hoạt động', value: 'inactive' },
]

const isEditMode = computed(() => !!props.department?.id)
const drawerTitle = computed(() => isEditMode.value ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới')

const schema = yup.object({
  code: yup.string().required('Mã phòng ban là bắt buộc'),
  name: yup.string().required('Tên phòng ban là bắt buộc'),
  description: yup.string().nullable(),
  status: yup.string().required('Trạng thái là bắt buộc'),
  sort_order: yup.number().nullable(),
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
  formData.value = {
    code: '',
    name: '',
    description: '',
    status: 'active',
    sort_order: 0,
  }
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
    if (isEditMode.value && props.department)
      await store.updateDepartment(props.department.id, formData.value)
    else
      await store.createDepartment(formData.value)

    showToast(isEditMode.value ? 'Cập nhật phòng ban thành công!' : 'Thêm phòng ban thành công!', 'success')
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
      // Map server errors (string[]) to single string per field
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

watch(() => props.department, dept => {
  if (dept) {
    formData.value = {
      code: dept.code || '',
      name: dept.name || '',
      description: dept.description || '',
      status: dept.status || 'active',
      sort_order: dept.sort_order ?? 0,
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
            <!-- Mã phòng ban -->
            <VCol cols="12">
              <AppTextField
                v-model="formData.code"
                label="Mã phòng ban"
                placeholder="Nhập mã phòng ban"
                :error-messages="fieldErrors.code"
                @update:model-value="fieldErrors.code = ''"
              />
            </VCol>

            <!-- Tên phòng ban -->
            <VCol cols="12">
              <AppTextField
                v-model="formData.name"
                label="Tên phòng ban"
                placeholder="Nhập tên phòng ban"
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
            <VCol
              cols="12"
              md="6"
            >
              <AppSelect
                v-model="formData.status"
                label="Trạng thái"
                :items="statusOptions"
                :error-messages="fieldErrors.status"
                @update:model-value="fieldErrors.status = ''"
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
                :error-messages="fieldErrors.sort_order"
                @update:model-value="fieldErrors.sort_order = ''"
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
