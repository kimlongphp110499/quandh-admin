<script setup lang="ts">
import { getErrorMessage } from '@/utils/errorMessage'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { VForm } from 'vuetify/components/VForm'
import AppSnackbar from '@/components/AppSnackbar.vue'
import { useUserStore } from '../stores/useUserStore'
import { useOrganizationStore } from '../stores/useOrganizationStore'
import { useRoleStore } from '../stores/useRoleStore'
import type { User } from '../services/userApi'

interface Props {
  isDrawerOpen: boolean
  user?: User | null
}

interface Emit {
  (e: 'update:isDrawerOpen', value: boolean): void
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const userStore = useUserStore()
const orgStore = useOrganizationStore()
const roleStore = useRoleStore()

const refVForm = ref<InstanceType<typeof VForm>>()
const isSubmitting = ref(false)
const serverErrors = ref<Record<string, string[]>>({})
const isPasswordVisible = ref(false)
const isPasswordConfirmVisible = ref(false)

const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

interface AssignmentRow {
  role_id: number | null
  organization_ids: number[]
}

const buildInitialForm = () => {
  if (props.user) {
    return {
      name: props.user.name || '',
      email: props.user.email || '',
      user_name: props.user.user_name || '',
      password: '',
      password_confirmation: '',
      status: (props.user.status || 'active') as 'active' | 'inactive',
      assignments: (props.user.assignments || []).map(a => ({
        role_id: a.role_id,
        organization_ids: a.organization_ids || [],
      })),
    }
  }

  return {
    name: '',
    email: '',
    user_name: '',
    password: '',
    password_confirmation: '',
    status: 'active' as 'active' | 'inactive',
    assignments: [] as AssignmentRow[],
  }
}

const formData = ref(buildInitialForm())

const statusOptions = [
  { title: 'Hoạt động', value: 'active' },
  { title: 'Không hoạt động', value: 'inactive' },
]

const orgSelectItems = computed(() =>
  orgStore.parentOptions.map(o => ({ title: o.name, value: o.id })),
)

const roleSelectItems = computed(() =>
  roleStore.roles.map(r => ({ title: r.name, value: r.id })),
)

const requiredRule = (v: string) => !!v?.trim() || 'Trường này là bắt buộc'
const emailRule = (v: string) => !v || /.[^\n\r@\u2028\u2029]*@.+\..+/.test(v) || 'Email không hợp lệ'

const serverErrorRule = (field: string) => () => {
  const errors = serverErrors.value[field]
  return !errors?.length || errors[0]
}

const assignmentErrorRule = (index: number, field: 'role_id' | 'organization_ids') => () => {
  const prefix = `assignments.${index}.${field}`
  const key = Object.keys(serverErrors.value).find(k => k === prefix || k.startsWith(`${prefix}.`))
  return !key || !serverErrors.value[key]?.length || serverErrors.value[key][0]
}

const isEditMode = computed(() => !!props.user?.id)
const drawerTitle = computed(() => isEditMode.value ? 'Cập nhật người dùng' : 'Thêm người dùng mới')

const addAssignment = () => {
  formData.value.assignments.push({ role_id: null, organization_ids: [] })
}

const removeAssignment = (index: number) => {
  formData.value.assignments.splice(index, 1)
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
  if (!val) resetForm()
})

const onSubmit = async () => {
  serverErrors.value = {}

  if (!refVForm.value) return

  const { valid } = await refVForm.value.validate()
  if (!valid) return

  isSubmitting.value = true

  try {
    const payload: any = {
      name: formData.value.name,
      email: formData.value.email,
      status: formData.value.status,
    }

    if (formData.value.user_name)
      payload.user_name = formData.value.user_name

    if (formData.value.password) {
      payload.password = formData.value.password
      payload.password_confirmation = formData.value.password_confirmation
    }

    const validAssignments = formData.value.assignments.filter(a => a.role_id !== null)
    if (isEditMode.value || validAssignments.length > 0) {
      payload.assignments = validAssignments.map(a => ({
        role_id: a.role_id!,
        organization_ids: a.organization_ids,
      }))
    }

    if (isEditMode.value)
      await userStore.updateItem(props.user!.id, payload)
    else
      await userStore.createItem(payload)

    showToast(isEditMode.value ? 'Cập nhật người dùng thành công!' : 'Thêm người dùng thành công!', 'success')
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

onMounted(() => {
  orgStore.fetchParentOptions()
  if (!roleStore.roles.length)
    roleStore.fetchRoles({ limit: 100 })
})
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
              <!-- Họ tên -->
              <VCol cols="12">
                <AppTextField
                  v-model="formData.name"
                  label="Họ và tên"
                  placeholder="Nhập họ và tên"
                  :rules="[requiredRule, serverErrorRule('name')]"
                />
              </VCol>

              <!-- Email -->
              <VCol cols="12">
                <AppTextField
                  v-model="formData.email"
                  label="Email"
                  placeholder="Nhập địa chỉ email"
                  type="email"
                  :rules="[requiredRule, emailRule, serverErrorRule('email')]"
                />
              </VCol>

              <!-- Tên đăng nhập -->
              <VCol cols="12">
                <AppTextField
                  v-model="formData.user_name"
                  label="Tên đăng nhập"
                  placeholder="Nhập tên đăng nhập (tùy chọn)"
                  :rules="[serverErrorRule('user_name')]"
                />
              </VCol>

              <!-- Mật khẩu -->
              <VCol cols="12">
                <AppTextField
                  v-model="formData.password"
                  label="Mật khẩu"
                  :placeholder="isEditMode ? 'Để trống nếu không đổi mật khẩu' : 'Nhập mật khẩu'"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :rules="isEditMode ? [serverErrorRule('password')] : [requiredRule, serverErrorRule('password')]"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>

              <!-- Xác nhận mật khẩu -->
              <VCol
                v-if="formData.password"
                cols="12"
              >
                <AppTextField
                  v-model="formData.password_confirmation"
                  label="Xác nhận mật khẩu"
                  placeholder="Nhập lại mật khẩu"
                  :type="isPasswordConfirmVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordConfirmVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :rules="[
                    (v: string) => !!v || 'Vui lòng xác nhận mật khẩu',
                    (v: string) => v === formData.password || 'Mật khẩu không khớp',
                  ]"
                  @click:append-inner="isPasswordConfirmVisible = !isPasswordConfirmVisible"
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

              <!-- Phân công tổ chức & vai trò -->
              <VCol cols="12">
                <div class="d-flex align-center justify-space-between mb-3">
                  <span class="text-body-2 font-weight-medium">Phân công tổ chức & vai trò</span>
                  <VBtn
                    size="small"
                    variant="tonal"
                    prepend-icon="tabler-plus"
                    @click="addAssignment"
                  >
                    Thêm
                  </VBtn>
                </div>

                <div
                  v-if="formData.assignments.length === 0"
                  class="text-body-2 text-disabled text-center py-4 border rounded"
                >
                  Chưa có phân công nào
                </div>

                <VCard
                  v-for="(assignment, index) in formData.assignments"
                  :key="index"
                  variant="outlined"
                  class="mb-3 pa-3"
                >
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-caption text-medium-emphasis">Phân công {{ index + 1 }}</span>
                    <VBtn
                      icon
                      size="x-small"
                      variant="text"
                      color="error"
                      @click="removeAssignment(index)"
                    >
                      <VIcon
                        icon="tabler-trash"
                        size="14"
                      />
                    </VBtn>
                  </div>

                  <VRow dense>
                    <VCol cols="12">
                      <AppSelect
                        v-model="assignment.role_id"
                        label="Vai trò"
                        :items="roleSelectItems"
                        placeholder="Chọn vai trò"
                        clearable
                        :rules="[assignmentErrorRule(index, 'role_id')]"
                      />
                    </VCol>
                    <VCol cols="12">
                      <AppSelect
                        v-model="assignment.organization_ids"
                        label="Tổ chức"
                        :items="orgSelectItems"
                        multiple
                        chips
                        closable-chips
                        placeholder="Chọn tổ chức"
                        :rules="[assignmentErrorRule(index, 'organization_ids')]"
                      />
                    </VCol>
                  </VRow>
                </VCard>
              </VCol>

              <!-- Actions -->
              <VCol cols="12">
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
            </VRow>
          </VForm>
        </VCardText>
      </PerfectScrollbar>
    </div>
  </VNavigationDrawer>

  <!-- Snackbar -->
  <AppSnackbar
    v-model="snackbar.show"
    :message="snackbar.message"
    :color="snackbar.color"
  />
</template>
