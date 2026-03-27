<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as yup from 'yup'
import { VForm } from 'vuetify/components/VForm'
import { MEETING_ROLE_OPTIONS, type Participant, type User, userSearchApi } from '@/api/modules/participant'
import { useParticipantStore } from '@/store/modules/participant'

interface Props {
  isDrawerOpen: boolean
  meetingId: number
  participant?: Participant | null
}

interface Emit {
  (e: 'update:isDrawerOpen', value: boolean): void
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const participantStore = useParticipantStore()

// Form
const refVForm = ref<VForm>()
const isSubmitting = ref(false)
const serverErrors = ref<Record<string, string[]>>({})

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

// User search (create mode)
const selectedUsers = ref<User[]>([])
const userSearchResults = ref<User[]>([])
const isSearchingUsers = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const autocompleteItems = computed(() => {
  const ids = new Set(userSearchResults.value.map(u => u.id))
  const extra = selectedUsers.value.filter(u => !ids.has(u.id))

  return [...userSearchResults.value, ...extra]
})

const onUserSearch = (val: string) => {
  if (searchTimeout)
    clearTimeout(searchTimeout)
  if (!val?.trim()) {
    userSearchResults.value = []

    return
  }
  searchTimeout = setTimeout(async () => {
    isSearchingUsers.value = true
    try {
      const res = await userSearchApi.search({ search: val.trim(), limit: 20, status: 'active' })
      if (res.data.success)
        userSearchResults.value = res.data.data || []
    }
    finally {
      isSearchingUsers.value = false
    }
  }, 400)
}

// Form data
const formData = ref({
  position: '',
  meeting_role: '' as string,
})

// ─── Yup schema ────────────────────────────────────────────────────────────
const roleValues = MEETING_ROLE_OPTIONS.map(r => r.value)

const participantSchema = yup.object({
  position: yup
    .string()
    .trim()
    .required('Chức vụ là bắt buộc')
    .max(500, 'Chức vụ không được vượt quá 500 ký tự'),

  meeting_role: yup
    .string()
    .required('Vai trò là bắt buộc')
    .oneOf(roleValues, 'Vai trò không hợp lệ'),
})

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

const serverErrorRule = (field: string) => () => {
  const errors = serverErrors.value[field]

  return !errors?.length || errors[0]
}

const positionRules = [yupRule(participantSchema.fields.position as yup.Schema), serverErrorRule('position')]
const roleRules = [yupRule(participantSchema.fields.meeting_role as yup.Schema), serverErrorRule('meeting_role')]

const userIdsRules = [
  () => {
    if (!isEditMode.value && !selectedUsers.value.length)
      return 'Phải chọn ít nhất 1 người dùng'

    return true
  },
  serverErrorRule('user_ids'),
]

// ─── Computed ──────────────────────────────────────────────────────────────
const isEditMode = computed(() => !!props.participant?.id)

const drawerTitle = computed(() =>
  isEditMode.value ? 'Cập nhật đại biểu' : 'Thêm đại biểu',
)

// ─── Methods ───────────────────────────────────────────────────────────────
const resetForm = () => {
  formData.value = { position: '', meeting_role: '' }
  selectedUsers.value = []
  userSearchResults.value = []
  serverErrors.value = {}
  refVForm.value?.resetValidation()
}

const closeDrawer = () => {
  emit('update:isDrawerOpen', false)
}

const onSubmit = async () => {
  serverErrors.value = {}

  // Yup validate
  try {
    await participantSchema.validate(formData.value, { abortEarly: false })
  }
  catch (yupError) {
    if (yupError instanceof yup.ValidationError) {
      yupError.inner.forEach(err => {
        if (err.path)
          serverErrors.value[err.path] = [err.message]
      })
    }
    await refVForm.value!.validate()

    return
  }

  // Vuetify validate (catches userIds rule & remaining server errors)
  const { valid } = await refVForm.value!.validate()
  if (!valid)
    return

  isSubmitting.value = true
  try {
    if (isEditMode.value) {
      await participantStore.updateParticipant(props.meetingId, props.participant!.id, {
        position: formData.value.position.trim(),
        meeting_role: formData.value.meeting_role,
      })
      showToast('Cập nhật đại biểu thành công!', 'success')
    }
    else {
      await participantStore.addParticipants(props.meetingId, {
        user_ids: selectedUsers.value.map(u => u.id),
        position: formData.value.position.trim(),
        meeting_role: formData.value.meeting_role,
      })
      showToast('Thêm đại biểu thành công!', 'success')
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
watch(() => props.participant, participant => {
  if (participant) {
    formData.value = {
      position: participant.position || '',
      meeting_role: participant.meeting_role || '',
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
            <!-- User search (create mode) -->
            <VCol
              v-if="!isEditMode"
              cols="12"
            >
              <VAutocomplete
                v-model="selectedUsers"
                :items="autocompleteItems"
                item-title="name"
                item-value="id"
                return-object
                multiple
                chips
                closable-chips
                :loading="isSearchingUsers"
                :rules="userIdsRules"
                label="Chọn người dùng *"
                placeholder="Nhập tên hoặc email để tìm kiếm..."
                no-filter
                hide-no-data
                @update:search="onUserSearch"
              >
                <template #item="{ props: itemProps, item }">
                  <VListItem
                    v-bind="itemProps"
                    :subtitle="item.raw.email"
                  >
                    <template #prepend>
                      <VAvatar
                        color="primary"
                        size="32"
                        class="me-2"
                      >
                        <span class="text-caption font-weight-bold">
                          {{ item.raw.name?.charAt(0)?.toUpperCase() }}
                        </span>
                      </VAvatar>
                    </template>
                  </VListItem>
                </template>
                <template #chip="{ props: chipProps, item }">
                  <VChip
                    v-bind="chipProps"
                    :text="item.raw.name"
                    size="small"
                    color="primary"
                    variant="tonal"
                  />
                </template>
              </VAutocomplete>
            </VCol>

            <!-- Edit mode: show user info as read-only -->
            <VCol
              v-else
              cols="12"
            >
              <div class="text-subtitle-2 text-medium-emphasis mb-2">
                Người dùng
              </div>
              <div class="d-flex align-center gap-3 pa-3 rounded bg-surface-variant">
                <VAvatar
                  color="primary"
                  size="36"
                >
                  <span class="text-body-2 font-weight-bold">
                    {{ props.participant?.user_name?.charAt(0)?.toUpperCase() ?? '?' }}
                  </span>
                </VAvatar>
                <div>
                  <div class="font-weight-medium">
                    {{ props.participant?.user_name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ props.participant?.user_email }}
                  </div>
                </div>
              </div>
            </VCol>

            <!-- Chức vụ -->
            <VCol cols="12">
              <AppTextField
                v-model="formData.position"
                label="Chức vụ *"
                placeholder="Nhập chức vụ của đại biểu trong cuộc họp"
                prepend-inner-icon="tabler-briefcase"
                :rules="positionRules"
              />
            </VCol>

            <!-- Vai trò -->
            <VCol cols="12">
              <AppSelect
                v-model="formData.meeting_role"
                :items="MEETING_ROLE_OPTIONS"
                item-title="title"
                item-value="value"
                label="Vai trò trong cuộc họp *"
                placeholder="Chọn vai trò"
                prepend-inner-icon="tabler-shield-half"
                :rules="roleRules"
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
