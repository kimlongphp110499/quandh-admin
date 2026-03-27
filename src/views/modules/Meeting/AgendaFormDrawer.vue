<!-- eslint-disable import/no-unresolved -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as yup from 'yup'
import { VForm } from 'vuetify/components/VForm'
// eslint-disable-next-line import/extensions
import { useAgendaStore } from '@/store/modules/agenda'
import type { Agenda } from '@/api/modules/agenda'

interface Props {
  isDrawerOpen: boolean
  meetingId: number
  agenda?: Agenda | null
  totalItems?: number
}

interface Emit {
  (e: 'update:isDrawerOpen', value: boolean): void
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const agendaStore = useAgendaStore()

// Form
const refVForm = ref<VForm>()
const isSubmitting = ref(false)
const serverErrors = ref<Record<string, string[]>>({})

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const formData = ref({
  title: '',
  description: '',
  duration: null as number | null,
  order_index: null as number | null,
})

// ─── Yup schema ────────────────────────────────────────────────────────────
const toNullableNumber = (v: any, o: any) =>
  o === '' || o === null || o === undefined ? null : v

const agendaSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required('Tiêu đề mục là bắt buộc1')
    .max(255, 'Tiêu đề không được vượt quá 255 ký tự'),

  description: yup
    .string()
    .nullable()
    .optional()
    .max(2000, 'Mô tả không được vượt quá 2000 ký tự'),

  duration: yup
    .number()
    .typeError('Thời lượng phải là số nguyên')
    .nullable()
    .optional()
    .transform(toNullableNumber)
    .integer('Thời lượng phải là số nguyên')
    .min(1, 'Thời lượng tối thiểu là 1 phút')
    .max(480, 'Thời lượng tối đa là 480 phút (8 giờ)'),

  order_index: yup
    .number()
    .typeError('Thứ tự phải là số nguyên')
    .nullable()
    .optional()
    .transform(toNullableNumber)
    .integer('Thứ tự phải là số nguyên')
    .min(0, 'Thứ tự phải lớn hơn hoặc bằng 0'),
})

// Convert a yup field schema → Vuetify rule function
const yupRule = (fieldSchema: yup.Schema) => async (value: any): Promise<true | string> => {
  try {
    await fieldSchema.validate(value)

    return true
  }
  catch (err) {
    if (err instanceof yup.ValidationError)
      return err.message

    return true
  }
}

// Server-side error rule (appended after yup rules)
const serverErrorRule = (field: string) => () => {
  const errors = serverErrors.value[field]

  return !errors?.length || errors[0]
}

// Composed rules per field
const titleRules = [yupRule(agendaSchema.fields.title as yup.Schema), serverErrorRule('title')]
const descriptionRules = [yupRule(agendaSchema.fields.description as yup.Schema), serverErrorRule('description')]
const durationRules = [yupRule(agendaSchema.fields.duration as yup.Schema), serverErrorRule('duration')]
const orderIndexRules = [yupRule(agendaSchema.fields.order_index as yup.Schema), serverErrorRule('order_index')]

// ─── Computed ──────────────────────────────────────────────────────────────
const isEditMode = computed(() => !!props.agenda?.id)

const drawerTitle = computed(() =>
  isEditMode.value ? 'Cập nhật mục chương trình' : 'Thêm mục chương trình',
)

// ─── Methods ───────────────────────────────────────────────────────────────
const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    duration: null,
    order_index: props.totalItems ?? 0,
  }
  serverErrors.value = {}
  refVForm.value?.resetValidation()
}

const closeDrawer = () => {
  emit('update:isDrawerOpen', false)
}

const onSubmit = async () => {
  serverErrors.value = {}

  // Yup full-schema validate (abortEarly: false to surface all errors)
  try {
    await agendaSchema.validate(formData.value, { abortEarly: false })
  }
  catch (yupError) {
    if (yupError instanceof yup.ValidationError) {
      // Map errors → serverErrors to trigger Vuetify re-validation per field
      yupError.inner.forEach(err => {
        if (err.path)
          serverErrors.value[err.path] = [err.message]
      })
    }
    await refVForm.value!.validate()

    return
  }

  // Vuetify-level validate (catches remaining server errors if any)
  const { valid } = await refVForm.value!.validate()
  if (!valid)
    return

  isSubmitting.value = true
  try {
    const payload: Partial<Agenda> = {
      title: formData.value.title.trim(),
      description: formData.value.description?.trim() || null,
      duration: formData.value.duration ? Number(formData.value.duration) : null,
      order_index: formData.value.order_index !== null ? Number(formData.value.order_index) : undefined,
    }

    if (isEditMode.value) {
      await agendaStore.updateAgenda(props.meetingId, props.agenda!.id, payload)
      showToast('Cập nhật mục chương trình thành công!', 'success')
    }
    else {
      await agendaStore.createAgenda(props.meetingId, payload)
      showToast('Thêm mục chương trình thành công!', 'success')
    }

    emit('submit')
    closeDrawer()
  }
  catch (error: any) {
    const responseData = error?.response?.data
    if (responseData?.code === 'VALIDATION_ERROR' && responseData?.errors) {
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

// ─── Watchers ──────────────────────────────────────────────────────────────
watch(() => props.agenda, agenda => {
  if (agenda) {
    formData.value = {
      title: agenda.title || '',
      description: agenda.description || '',
      duration: agenda.duration ?? null,
      order_index: agenda.order_index ?? null,
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
    <!-- Header -->
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
            <!-- Tiêu đề -->
            <VCol cols="12">
              <AppTextField
                v-model="formData.title"
                label="Tiêu đề mục *"
                placeholder="Nhập tiêu đề mục chương trình"
                :rules="titleRules"
              />
            </VCol>

            <!-- Mô tả -->
            <VCol cols="12">
              <AppTextarea
                v-model="formData.description"
                label="Mô tả"
                placeholder="Nhập mô tả chi tiết về mục này"
                rows="3"
                :rules="descriptionRules"
              />
            </VCol>

            <!-- Thời lượng & Thứ tự -->
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="formData.duration"
                label="Thời lượng (phút)"
                placeholder="VD: 30"
                type="text"
                prepend-inner-icon="tabler-clock"
                hint="Từ 1 đến 480 phút"
                persistent-hint
                :rules="durationRules"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="formData.order_index"
                label="Vị trí (thứ tự)"
                placeholder="VD: 0"
                type="text"
                prepend-inner-icon="tabler-sort-ascending"
                hint="Bắt đầu từ 0"
                persistent-hint
                :rules="orderIndexRules"
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

  <!-- Toast Snackbar -->
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
