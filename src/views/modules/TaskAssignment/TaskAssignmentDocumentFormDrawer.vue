<!-- eslint-disable import/no-unresolved -->
<!-- eslint-disable import/extensions -->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { VForm } from 'vuetify/components/VForm'
import { getErrorMessage } from '@/utils/errorMessage'
import AppSnackbar from '@/components/AppSnackbar.vue'
import { useTaskAssignmentDocumentStore } from '@/store/modules/task-assignment-document'
import type { TaskAssignmentDocument } from '@/api/modules/task-assignment-document'
import { taskAssignmentTypeApi } from '@/api/modules/task-assignment-type'

interface Props {
  isDrawerOpen: boolean
  document?: TaskAssignmentDocument | null
}

interface Emit {
  (e: 'update:isDrawerOpen', value: boolean): void
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const store = useTaskAssignmentDocumentStore()

const refVForm = ref<InstanceType<typeof VForm>>()
const isSubmitting = ref(false)
const serverErrors = ref<Record<string, string[]>>({})
const snackbar = ref({ show: false, message: '', color: 'success' })

// --- Infinity scroll cho loại văn bản ---
const typeOptions = ref<{ title: string; value: number }[]>([])
const typePage = ref(1)
const typeTotal = ref(0)
const typeLoading = ref(false)
const typeHasMore = computed(() => typeOptions.value.length < typeTotal.value)

const loadTypeOptions = async (reset = false) => {
  if (typeLoading.value)
    return
  if (reset) {
    typePage.value = 1
    typeOptions.value = []
  }
  typeLoading.value = true
  try {
    const response = await taskAssignmentTypeApi.list({
      page: typePage.value,
      limit: 20,
      status: 'active',
    })

    if (response.data.success) {
      const newItems = (response.data.data || []).map((t: any) => ({
        title: t.name,
        value: t.id,
      }))

      typeOptions.value = reset ? newItems : [...typeOptions.value, ...newItems]
      typeTotal.value = response.data.meta?.total || 0
      typePage.value++
    }
  }
  catch {
    // Không hiển thị lỗi nếu load dropdown thất bại
  }
  finally {
    typeLoading.value = false
  }
}

const onTypeIntersect = (isIntersecting: boolean) => {
  if (isIntersecting && typeHasMore.value && !typeLoading.value)
    loadTypeOptions()
}

// --- Form ---
const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const statusOptions = [
  { title: 'Bản nháp', value: 'draft' },
  { title: 'Ban hành', value: 'issued' },
]

const buildInitialForm = () => {
  if (props.document) {
    return {
      name: props.document.name || '',
      summary: props.document.summary || '',
      issue_date: props.document.issue_date || '',
      task_assignment_type_id: props.document.task_assignment_type_id || null,
      status: (props.document.status || 'draft') as 'draft' | 'issued',
    }
  }

  return {
    name: '',
    summary: '',
    issue_date: '',
    task_assignment_type_id: null as number | null,
    status: 'draft' as 'draft' | 'issued',
  }
}

const formData = ref(buildInitialForm())

const isEditMode = computed(() => !!props.document?.id)

const isIssued = computed(() => props.document?.status === 'issued')

const drawerTitle = computed(() => {
  if (!isEditMode.value)
    return 'Thêm văn bản giao việc mới'

  return isIssued.value ? 'Xem văn bản giao việc (Đã ban hành)' : 'Chỉnh sửa văn bản giao việc'
})

const requiredRule = (v: string) => !!v?.trim() || 'Trường này là bắt buộc'

const serverErrorRule = (field: string) => () => {
  const errors = serverErrors.value[field]

  return !errors?.length || errors[0]
}

const resetForm = () => {
  formData.value = buildInitialForm()
  serverErrors.value = {}
  refVForm.value?.resetValidation()
}

const closeDrawer = () => {
  emit('update:isDrawerOpen', false)
}

watch(() => props.isDrawerOpen, val => {
  if (val) {
    formData.value = buildInitialForm()
    loadTypeOptions(true)
  }
  else {
    resetForm()
  }
})

const onSubmit = async () => {
  serverErrors.value = {}

  if (!refVForm.value)
    return

  const { valid } = await refVForm.value.validate()
  if (!valid)
    return

  isSubmitting.value = true

  try {
    const payload = {
      ...formData.value,
      issue_date: formData.value.issue_date || undefined,
      task_assignment_type_id: formData.value.task_assignment_type_id || undefined,
    }

    if (isEditMode.value && props.document)
      await store.updateDocument(props.document.id, payload)
    else
      await store.createDocument(payload)

    showToast(isEditMode.value ? 'Cập nhật văn bản giao việc thành công!' : 'Thêm văn bản giao việc thành công!', 'success')
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
      await nextTick()
      await refVForm.value?.validate()
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
</script>

<template>
  <VNavigationDrawer
    :model-value="props.isDrawerOpen"
    temporary
    location="end"
    width="520"
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
          <VForm ref="refVForm">
            <VRow>
              <!-- Tên văn bản -->
              <VCol cols="12">
                <AppTextField
                  v-model="formData.name"
                  label="Tên văn bản giao việc"
                  placeholder="Nhập tên văn bản giao việc"
                  :readonly="isIssued"
                  :rules="[requiredRule, serverErrorRule('name')]"
                />
              </VCol>

              <!-- Loại văn bản - infinity scroll -->
              <VCol cols="12">
                <div class="v-label mb-1 text-body-2">
                  Loại văn bản
                </div>
                <VAutocomplete
                  v-model="formData.task_assignment_type_id"
                  placeholder="Chọn loại văn bản..."
                  :items="typeOptions"
                  :loading="typeLoading"
                  item-title="title"
                  item-value="value"
                  clearable
                  :readonly="isIssued"
                  :rules="[serverErrorRule('task_assignment_type_id')]"
                >
                  <!-- Sentinel cuối danh sách để trigger load thêm -->
                  <template #append-item>
                    <div
                      v-if="typeHasMore || typeLoading"
                      v-intersect="{ handler: onTypeIntersect, options: { threshold: 0.5 } }"
                      class="d-flex justify-center align-center pa-2"
                    >
                      <VProgressCircular
                        v-if="typeLoading"
                        indeterminate
                        size="20"
                        width="2"
                      />
                    </div>
                  </template>
                </VAutocomplete>
              </VCol>

              <!-- Ngày ban hành -->
              <VCol cols="12">
                <AppDateTimePicker
                  v-model="formData.issue_date"
                  label="Ngày ban hành"
                  :config="{
                    dateFormat: 'd/m/Y',
                  }"
                  :readonly="isIssued"
                  :rules="[serverErrorRule('issue_date')]"
                />
              </VCol>

              <!-- Trạng thái -->
              <VCol cols="12">
                <AppSelect
                  v-model="formData.status"
                  label="Trạng thái"
                  :items="statusOptions"
                  :readonly="isIssued"
                  :rules="[requiredRule, serverErrorRule('status')]"
                />
              </VCol>

              <!-- Tóm tắt -->
              <VCol cols="12">
                <AppTextarea
                  v-model="formData.summary"
                  label="Tóm tắt nội dung"
                  placeholder="Nhập tóm tắt nội dung văn bản"
                  rows="4"
                  :readonly="isIssued"
                  :rules="[serverErrorRule('summary')]"
                />
              </VCol>

              <!-- Actions -->
              <VCol
                v-if="!isIssued"
                cols="12"
              >
                <VBtn
                  class="me-3"
                  :loading="isSubmitting"
                  @click="onSubmit"
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
              <VCol
                v-else
                cols="12"
              >
                <VBtn
                  variant="tonal"
                  color="secondary"
                  @click="closeDrawer"
                >
                  Đóng
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
