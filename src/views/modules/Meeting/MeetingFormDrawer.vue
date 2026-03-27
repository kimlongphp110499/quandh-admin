<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { VForm } from 'vuetify/components/VForm'
import dayjs from 'dayjs'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useMeetingStore } from '@/store/modules/meeting'
import type { Meeting } from '@/api/modules/meeting'

interface Props {
  isDrawerOpen: boolean
  meeting?: Meeting | null
}

interface Emit {
  (e: 'update:isDrawerOpen', value: boolean): void
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const meetingStore = useMeetingStore()

// Form
const refVForm = ref<VForm>()
const isSubmitting = ref(false)
const serverErrors = ref<Record<string, string[]>>({})

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const formData = ref({
  title: '',
  description: '',
  location: '',
  start_at: '',
  end_at: '',
  status: 'draft',
})

const statusOptions = [
  { title: 'Nháp', value: 'draft' },
  { title: 'Đã lên lịch', value: 'active' },
  { title: 'Đang diễn ra', value: 'in_progress' },
  { title: 'Đã kết thúc', value: 'ended' },
]

// Validation rules
const requiredRule = (v: string) => !!v?.trim() || 'Trường này là bắt buộc'
const dateTimeRule = (v: string) => !!v || 'Ngày giờ là bắt buộc'

// Server-side error rules
const serverErrorRule = (field: string) => () => {
  const errors = serverErrors.value[field]

  return !errors?.length || errors[0]
}

const isEditMode = computed(() => !!props.meeting?.id)
const drawerTitle = computed(() => isEditMode.value ? 'Cập nhật cuộc họp' : 'Thêm cuộc họp mới')

// Methods
const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    location: '',
    start_at: '',
    end_at: '',
    status: 'draft',
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
    // Format dates for API (Y-m-d H:i:s)
    const payload = {
      ...formData.value,
      start_at: formData.value.start_at ? dayjs(formData.value.start_at).format('YYYY-MM-DD HH:mm:ss') : '',
      end_at: formData.value.end_at ? dayjs(formData.value.end_at).format('YYYY-MM-DD HH:mm:ss') : '',
    }

    if (isEditMode.value)
      await meetingStore.updateMeeting(props.meeting!.id, payload)
    else
      await meetingStore.createMeeting(payload)

    showToast(isEditMode.value ? 'Cập nhật cuộc họp thành công!' : 'Thêm cuộc họp thành công!', 'success')
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

// Watch for editing meeting
watch(() => props.meeting, meeting => {
  if (meeting) {
    formData.value = {
      title: meeting.title || '',
      description: meeting.description || '',
      location: meeting.location || '',
      start_at: meeting.start_at || '',
      end_at: meeting.end_at || '',
      status: meeting.status || 'draft',
    }
  }
  else {
    resetForm()
  }
}, { immediate: true })

// Reset form when drawer closes
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
    width="500"
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
                label="Tiêu đề cuộc họp"
                placeholder="Nhập tiêu đề cuộc họp"
                :rules="[requiredRule, serverErrorRule('title')]"
              />
            </VCol>

            <!-- Mô tả -->
            <VCol cols="12">
              <AppTextarea
                v-model="formData.description"
                label="Mô tả"
                placeholder="Nhập mô tả chi tiết về cuộc họp"
                rows="3"
                :rules="[requiredRule, serverErrorRule('description')]"
              />
            </VCol>

            <!-- Địa điểm -->
            <VCol cols="12">
              <AppTextField
                v-model="formData.location"
                label="Địa điểm"
                placeholder="Phòng họp A"
                prepend-inner-icon="tabler-map-pin"
                :rules="[requiredRule, serverErrorRule('location')]"
              />
            </VCol>

            <!-- Bắt đầu -->
            <VCol
              cols="12"
              md="6"
            >
              <AppDateTimePicker
                v-model="formData.start_at"
                label="Bắt đầu"
                placeholder="Chọn ngày giờ bắt đầu"
                :rules="[dateTimeRule, serverErrorRule('start_at')]"
                :config="{
                  enableTime: true,
                  dateFormat: 'Y-m-d H:i',
                  time_24hr: true,
                }"
              />
            </VCol>

            <!-- Kết thúc -->
            <VCol
              cols="12"
              md="6"
            >
              <AppDateTimePicker
                v-model="formData.end_at"
                label="Kết thúc"
                placeholder="Chọn ngày giờ kết thúc"
                :rules="[dateTimeRule, serverErrorRule('end_at')]"
                :config="{
                  enableTime: true,
                  dateFormat: 'Y-m-d H:i',
                  time_24hr: true,
                }"
              />
            </VCol>

            <!-- Trạng thái -->
            <VCol cols="12">
              <AppSelect
                v-model="formData.status"
                label="Trạng thái"
                :items="statusOptions"
                :rules="[requiredRule]"
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
