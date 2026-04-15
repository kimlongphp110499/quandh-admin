<!-- eslint-disable import/no-unresolved -->
<!-- eslint-disable import/extensions -->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { VForm } from 'vuetify/components/VForm'
import { getErrorMessage } from '@/utils/errorMessage'
import AppSnackbar from '@/components/AppSnackbar.vue'
import { useItemStore } from '../stores/useItemStore'
import type {
  Item,
  ItemDepartmentPayload,
  ItemUserPayload,
} from '../services/itemApi'
import { documentApi } from '../services/documentApi'
import { itemTypeApi } from '../services/itemTypeApi'
import { departmentApi } from '../services/departmentApi'
import { userApi } from '@/api/modules/user'
import { ITEM_STATUS_OPTIONS, ITEM_PRIORITY_OPTIONS, ITEM_DEADLINE_TYPE_OPTIONS, ASSIGNMENT_STATUS_OPTIONS, ASSIGNMENT_ROLE_OPTIONS, DEPARTMENT_ROLE_OPTIONS } from '../configs/itemOptions'

interface Props {
  isDrawerOpen: boolean
  item?: Item | null
}

interface Emit {
  (e: 'update:isDrawerOpen', value: boolean): void
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const store = useItemStore()

const refVForm = ref<InstanceType<typeof VForm>>()
const isSubmitting = ref(false)
const serverErrors = ref<Record<string, string[]>>({})
const snackbar = ref({ show: false, message: '', color: 'success' })

// --- Văn bản giao việc (infinity scroll) ---
const documentOptions = ref<{ title: string; value: number }[]>([])
const documentPage = ref(1)
const documentTotal = ref(0)
const documentLoading = ref(false)
const documentHasMore = computed(() => documentOptions.value.length < documentTotal.value)

const loadDocumentOptions = async (reset = false) => {
  if (documentLoading.value)
    return
  if (reset) {
    documentPage.value = 1
    documentOptions.value = []
  }
  documentLoading.value = true
  try {
    const res = await documentApi.list({ page: documentPage.value, limit: 20 })
    if (res.data.success) {
      const newItems = (res.data.data || []).map((d: any) => ({ title: d.name, value: d.id }))

      documentOptions.value = reset ? newItems : [...documentOptions.value, ...newItems]
      documentTotal.value = res.data.meta?.total || 0
      documentPage.value++
    }
  }
  catch { /* silent */ }
  finally { documentLoading.value = false }
}

const onDocumentIntersect = (isIntersecting: boolean) => {
  if (isIntersecting && documentHasMore.value && !documentLoading.value)
    loadDocumentOptions()
}

// --- Loại công việc (infinity scroll) ---
const itemTypeOptions = ref<{ title: string; value: number }[]>([])
const itemTypePage = ref(1)
const itemTypeTotal = ref(0)
const itemTypeLoading = ref(false)
const itemTypeHasMore = computed(() => itemTypeOptions.value.length < itemTypeTotal.value)

const loadItemTypeOptions = async (reset = false) => {
  if (itemTypeLoading.value)
    return
  if (reset) {
    itemTypePage.value = 1
    itemTypeOptions.value = []
  }
  itemTypeLoading.value = true
  try {
    const res = await itemTypeApi.list({ page: itemTypePage.value, limit: 20, status: 'active' })
    if (res.data.success) {
      const newItems = (res.data.data || []).map((t: any) => ({ title: t.name, value: t.id }))

      itemTypeOptions.value = reset ? newItems : [...itemTypeOptions.value, ...newItems]
      itemTypeTotal.value = res.data.meta?.total || 0
      itemTypePage.value++
    }
  }
  catch { /* silent */ }
  finally { itemTypeLoading.value = false }
}

const onItemTypeIntersect = (isIntersecting: boolean) => {
  if (isIntersecting && itemTypeHasMore.value && !itemTypeLoading.value)
    loadItemTypeOptions()
}

// --- Phòng ban ---
const departmentOptions = ref<{ title: string; value: number }[]>([])
const departmentLoading = ref(false)

const loadDepartmentOptions = async () => {
  departmentLoading.value = true
  try {
    const res = await departmentApi.list({ limit: 100, status: 'active' })
    if (res.data.success) {
      console.log(res.data)
      departmentOptions.value = (res.data.data || []).map((d: any) => ({
        title: d.name,
        value: d.id,
      }))
    }
  }
  catch { /* silent */ }
  finally { departmentLoading.value = false }
}

// --- Người dùng ---
const userOptions = ref<{ title: string; value: number }[]>([])
const userLoading = ref(false)

const loadUserOptions = async () => {
  userLoading.value = true
  try {
    const res = await userApi.list({ limit: 10 })
    if (res.data.success) {
      userOptions.value = (res.data.data || []).map((u: any) => ({
        title: u.name,
        value: u.id,
      }))
    }
  }
  catch { /* silent */ }
  finally { userLoading.value = false }
}

// --- Helpers ---
const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const statusOptions = ITEM_STATUS_OPTIONS

const priorityOptions = ITEM_PRIORITY_OPTIONS

const deadlineTypeOptions = ITEM_DEADLINE_TYPE_OPTIONS

const departmentRoleOptions = DEPARTMENT_ROLE_OPTIONS

const assignmentRoleOptions = ASSIGNMENT_ROLE_OPTIONS

const assignmentStatusOptions = ASSIGNMENT_STATUS_OPTIONS

// --- Build form ---
const buildInitialForm = () => {
  if (props.item) {
    return {
      task_assignment_document_id: props.item.task_assignment_document_id as number | null,
      name: props.item.name || '',
      description: props.item.description || '',
      task_assignment_item_type_id: props.item.task_assignment_item_type_id || null,
      deadline_type: props.item.deadline_type || 'has_deadline',
      start_at: props.item.start_at || '',
      end_at: props.item.end_at || '',
      processing_status: props.item.processing_status || 'todo',
      completion_percent: props.item.completion_percent ?? 0,
      priority: props.item.priority || 'medium',
      department_ids: (props.item.departments || []).map(d => ({
        department_id: d.id,
        role: d.role as 'main' | 'cooperate',
      })) as ItemDepartmentPayload[],
      user_assignments: (props.item.users || []).map(u => ({
        user_id: u.id,
        department_id: u.department_id,
        assignment_role: u.assignment_role as 'main' | 'support',
        assignment_status: u.assignment_status as 'assigned' | 'accepted' | 'rejected' | 'done',
        note: u.note || '',
      })) as ItemUserPayload[],
    }
  }

  return {
    task_assignment_document_id: null as number | null,
    name: '',
    description: '',
    task_assignment_item_type_id: null as number | null,
    deadline_type: 'has_deadline' as 'has_deadline' | 'no_deadline',
    start_at: '',
    end_at: '',
    processing_status: 'todo' as string,
    completion_percent: 0,
    priority: 'medium' as string,
    department_ids: [] as ItemDepartmentPayload[],
    user_assignments: [] as ItemUserPayload[],
  }
}

const formData = ref(buildInitialForm())

const isEditMode = computed(() => !!props.item?.id)

const isDocumentIssued = computed(() => props.item?.document?.status === 'issued')

const drawerTitle = computed(() => {
  if (!isEditMode.value)
    return 'Thêm công việc mới'

  return isDocumentIssued.value ? 'Xem công việc (Văn bản đã ban hành)' : 'Chỉnh sửa công việc'
})

const hasDeadline = computed(() => formData.value.deadline_type === 'has_deadline')

const requiredRule = (v: any) => (v !== null && v !== undefined && v !== '') || 'Trường này là bắt buộc'

const serverErrorRule = (field: string) => () => {
  const errors = serverErrors.value[field]

  return !errors?.length || errors[0]
}

// --- Business rules: trạng thái <-> % hoàn thành ---
const onStatusChange = (val: string) => {
  if (val === 'done')
    formData.value.completion_percent = 100
}

const onPercentChange = (val: number) => {
  if (val >= 100 && formData.value.processing_status !== 'done')
    formData.value.processing_status = 'done'
  else if (val < 100 && formData.value.processing_status === 'done')
    formData.value.processing_status = 'in_progress'
}

// --- Phòng ban ---
const addDepartment = () => {
  formData.value.department_ids.push({ department_id: '' as any, role: 'main' })
}

const removeDepartment = (index: number) => {
  formData.value.department_ids.splice(index, 1)
}

// --- Người dùng ---
const addUserAssignment = () => {
  formData.value.user_assignments.push({
    user_id: null as any,
    department_id: null as any,
    assignment_role: 'main',
    assignment_status: 'assigned',
    note: '',
  })
}

const removeUserAssignment = (index: number) => {
  formData.value.user_assignments.splice(index, 1)
}

// --- Reset/close ---
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
    loadDocumentOptions(true)
    loadItemTypeOptions(true)
    loadDepartmentOptions()
    loadUserOptions()
  }
  else {
    resetForm()
  }
})

// --- Submit ---
const onSubmit = async () => {
  serverErrors.value = {}

  if (!refVForm.value)
    return

  const { valid } = await refVForm.value.validate()
  if (!valid)
    return

  isSubmitting.value = true

  try {
    const payload: any = {
      task_assignment_document_id: formData.value.task_assignment_document_id!,
      name: formData.value.name,
      description: formData.value.description || undefined,
      task_assignment_item_type_id: formData.value.task_assignment_item_type_id || undefined,
      deadline_type: formData.value.deadline_type,
      start_at: formData.value.start_at || undefined,
      end_at: hasDeadline.value ? (formData.value.end_at || undefined) : undefined,
      processing_status: formData.value.processing_status,
      completion_percent: formData.value.completion_percent,
      priority: formData.value.priority || undefined,
      department_ids: formData.value.department_ids.filter(d => d.department_id),
      user_assignments: formData.value.user_assignments
        .filter(u => u.user_id && u.department_id)
        .map(u => ({
          user_id: u.user_id,
          department_id: u.department_id,
          assignment_role: u.assignment_role,
          assignment_status: u.assignment_status,
          note: u.note || undefined,
        })),
    }

    if (isEditMode.value && props.item)
      await store.updateItem(props.item.id, payload)
    else
      await store.createItem(payload)

    showToast(isEditMode.value ? 'Cập nhật công việc thành công!' : 'Thêm công việc thành công!', 'success')
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
    width="620"
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
              <!-- Tên công việc -->
              <VCol cols="12">
                <AppTextField
                  v-model="formData.name"
                  label="Tên công việc *"
                  placeholder="Nhập tên công việc"
                  :readonly="isDocumentIssued"
                  :rules="[requiredRule, serverErrorRule('name')]"
                />
              </VCol>

              <!-- Văn bản giao việc -->
              <VCol cols="12">
                <div class="app-text-field">
                  <label class="v-label mb-1 text-body-2"> Văn bản giao việc * </label>
                </div>
                <VAutocomplete
                  v-model="formData.task_assignment_document_id"
                  placeholder="Chọn văn bản giao việc..."
                  :items="documentOptions"
                  item-title="title"
                  item-value="value"
                  clearable
                  :readonly="isDocumentIssued"
                  :rules="[requiredRule, serverErrorRule('task_assignment_document_id')]"
                >
                  <template #append-item>
                    <div
                      v-if="documentHasMore || documentLoading"
                      v-intersect="{ handler: onDocumentIntersect, options: { threshold: 0.5 } }"
                      class="d-flex justify-center pa-2"
                    >
                      <VProgressCircular
                        v-if="documentLoading"
                        indeterminate
                        size="18"
                        width="2"
                      />
                    </div>
                  </template>
                </VAutocomplete>
              </VCol>

              <!-- Loại công việc -->
              <VCol cols="12">
                <div class="v-label mb-1 text-body-2">
                  Loại công việc
                </div>
                <VAutocomplete
                  v-model="formData.task_assignment_item_type_id"
                  placeholder="Chọn loại công việc..."
                  :items="itemTypeOptions"
                  item-title="title"
                  item-value="value"
                  clearable
                  :readonly="isDocumentIssued"
                  :rules="[serverErrorRule('task_assignment_item_type_id')]"
                >
                  <template #append-item>
                    <div
                      v-if="itemTypeHasMore || itemTypeLoading"
                      v-intersect="{ handler: onItemTypeIntersect, options: { threshold: 0.5 } }"
                      class="d-flex justify-center pa-2"
                    >
                      <VProgressCircular
                        v-if="itemTypeLoading"
                        indeterminate
                        size="18"
                        width="2"
                      />
                    </div>
                  </template>
                </VAutocomplete>
              </VCol>

              <!-- Mô tả -->
              <VCol cols="12">
                <AppTextarea
                  v-model="formData.description"
                  label="Mô tả"
                  placeholder="Nhập mô tả chi tiết công việc"
                  rows="3"
                  :readonly="isDocumentIssued"
                  :rules="[serverErrorRule('description')]"
                />
              </VCol>

              <!-- Thời hạn & Tiến độ -->

              <!-- Loại thời hạn + Mức độ ưu tiên -->
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  v-model="formData.deadline_type"
                  label="Loại thời hạn *"
                  :items="deadlineTypeOptions"
                  :readonly="isDocumentIssued"
                  :rules="[requiredRule, serverErrorRule('deadline_type')]"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  v-model="formData.priority"
                  label="Mức độ ưu tiên"
                  :items="priorityOptions"
                  :readonly="isDocumentIssued"
                  :rules="[serverErrorRule('priority')]"
                />
              </VCol>

              <!-- Ngày bắt đầu / kết thúc -->
              <VCol
                cols="12"
                md="6"
              >
                <AppDateTimePicker
                  v-model="formData.start_at"
                  label="Ngày bắt đầu"
                  :config="{ dateFormat: 'd/m/Y' }"
                  :readonly="isDocumentIssued"
                  :rules="[serverErrorRule('start_at')]"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppDateTimePicker
                  v-model="formData.end_at"
                  label="Ngày kết thúc"
                  :disabled="!hasDeadline"
                  :readonly="isDocumentIssued"
                  :config="{ dateFormat: 'd/m/Y' }"
                  :rules="[serverErrorRule('end_at')]"
                />
                <div
                  v-if="!hasDeadline"
                  class="text-caption text-disabled mt-1"
                >
                  Không áp dụng khi chọn "Không có thời hạn"
                </div>
              </VCol>

              <!-- Trạng thái + % hoàn thành -->
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  v-model="formData.processing_status"
                  label="Trạng thái"
                  :items="statusOptions"
                  :readonly="isDocumentIssued"
                  :rules="[serverErrorRule('processing_status')]"
                  @update:model-value="onStatusChange"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model.number="formData.completion_percent"
                  label="% Hoàn thành"
                  type="number"
                  :min="0"
                  :max="100"
                  :readonly="isDocumentIssued"
                  :rules="[serverErrorRule('completion_percent')]"
                  @update:model-value="onPercentChange"
                />
              </VCol>

              <!-- Phòng ban thực hiện -->
              <VCol cols="12">
                <div class="d-flex align-center justify-space-between mb-3">
                  <span class="text-body-2 font-weight-medium">Phòng ban thực hiện</span>
                  <VBtn
                    v-if="!isDocumentIssued"
                    size="small"
                    variant="tonal"
                    prepend-icon="tabler-plus"
                    @click="addDepartment"
                  >
                    Thêm
                  </VBtn>
                </div>

                <div
                  v-if="formData.department_ids.length === 0"
                  class="text-body-2 text-disabled text-center py-4 border rounded"
                >
                  Chưa có phòng ban nào
                </div>

                <VCard
                  v-for="(dept, index) in formData.department_ids"
                  :key="index"
                  variant="outlined"
                  class="mb-3 pa-3"
                >
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-caption text-medium-emphasis">Phòng ban {{ index + 1 }}</span>
                    <VBtn
                      v-if="!isDocumentIssued"
                      icon
                      size="x-small"
                      variant="text"
                      color="error"
                      @click="removeDepartment(index)"
                    >
                      <VIcon
                        icon="tabler-trash"
                        size="14"
                      />
                    </VBtn>
                  </div>

                  <VRow dense>
                    <VCol cols="12">
                      <div class="app-text-field">
                        <label class="v-label mb-1 text-body-2"> Phòng ban </label>
                      </div>
                      <VAutocomplete
                        v-model="dept.department_id"
                        placeholder="Chọn phòng ban..."
                        :items="departmentOptions"
                        item-title="title"
                        item-value="value"
                        clearable
                        :readonly="isDocumentIssued"
                      />
                    </VCol>
                    <VCol cols="12">
                      <div class="app-text-field">
                        <label class="v-label mb-1 text-body-2"> Vai trò </label>
                      </div>
                      <AppSelect
                        v-model="dept.role"
                        :items="departmentRoleOptions"
                        :readonly="isDocumentIssued"
                      />
                    </VCol>
                  </VRow>
                </VCard>
              </VCol>

              <!-- Người thực hiện -->
              <VCol cols="12">
                <div class="d-flex align-center justify-space-between mb-3">
                  <span class="text-body-2 font-weight-medium">Người thực hiện</span>
                  <VBtn
                    v-if="!isDocumentIssued"
                    size="small"
                    variant="tonal"
                    prepend-icon="tabler-plus"
                    @click="addUserAssignment"
                  >
                    Thêm
                  </VBtn>
                </div>

                <div
                  v-if="formData.user_assignments.length === 0"
                  class="text-body-2 text-disabled text-center py-4 border rounded"
                >
                  Chưa có người thực hiện nào
                </div>

                <VCard
                  v-for="(assignment, index) in formData.user_assignments"
                  :key="index"
                  variant="outlined"
                  class="mb-3 pa-3"
                >
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-caption text-medium-emphasis">Người thực hiện {{ index + 1 }}</span>
                    <VBtn
                      v-if="!isDocumentIssued"
                      icon
                      size="x-small"
                      variant="text"
                      color="error"
                      @click="removeUserAssignment(index)"
                    >
                      <VIcon
                        icon="tabler-trash"
                        size="14"
                      />
                    </VBtn>
                  </div>

                  <VRow dense>
                    <VCol cols="12">
                      <div class="app-text-field">
                        <label class="v-label mb-1 text-body-2"> Người dùng </label>
                      </div>
                      <VAutocomplete
                        v-model="assignment.user_id"
                        placeholder="Chọn người dùng..."
                        :items="userOptions"
                        item-title="title"
                        item-value="value"
                        clearable
                        :readonly="isDocumentIssued"
                      />
                    </VCol>

                    <VCol cols="12">
                      <div class="app-text-field">
                        <label class="v-label mb-1 text-body-2"> Phòng ban </label>
                      </div>
                      <VAutocomplete
                        v-model="assignment.department_id"
                        placeholder="Chọn phòng ban..."
                        :items="departmentOptions"
                        item-title="title"
                        item-value="value"
                        clearable
                        :readonly="isDocumentIssued"
                      />
                    </VCol>

                    <VCol cols="12">
                      <AppSelect
                        v-model="assignment.assignment_role"
                        label="Vai trò"
                        :items="assignmentRoleOptions"
                        :readonly="isDocumentIssued"
                      />
                    </VCol>

                    <VCol cols="12">
                      <AppSelect
                        v-model="assignment.assignment_status"
                        label="Trạng thái giao việc"
                        :items="assignmentStatusOptions"
                        :readonly="isDocumentIssued"
                      />
                    </VCol>

                    <VCol cols="12">
                      <AppTextField
                        v-model="assignment.note"
                        label="Ghi chú"
                        placeholder="Ghi chú khi giao việc..."
                        :readonly="isDocumentIssued"
                      />
                    </VCol>
                  </VRow>
                </VCard>
              </VCol>

              <!-- Actions -->
              <VCol
                v-if="!isDocumentIssued"
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
