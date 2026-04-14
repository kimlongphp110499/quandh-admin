<!-- eslint-disable import/no-unresolved -->
<!-- eslint-disable import/extensions -->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VForm } from 'vuetify/components/VForm'
import { getErrorMessage } from '@/utils/errorMessage'
import { normalizeDate } from '@/utils/formatters'
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import { taskAssignmentDocumentApi } from '@/api/modules/task-assignment-document'
import { taskAssignmentItemApi } from '@/api/modules/task-assignment-item'
import { taskAssignmentItemTypeApi } from '@/api/modules/task-assignment-item-type'
import { taskAssignmentDepartmentApi } from '@/api/modules/task-assignment-department'
import { taskAssignmentTypeApi } from '@/api/modules/task-assignment-type'
import { userApi } from '@/api/modules/user'
import type { TaskAssignmentDocument, TaskAssignmentDocumentAttachment } from '@/api/modules/task-assignment-document'
import type {
  TaskAssignmentItem,
  TaskAssignmentItemDepartmentPayload,
  TaskAssignmentItemUserPayload,
} from '@/api/modules/task-assignment-item'

const route = useRoute()
const router = useRouter()
const documentId = computed(() => Number(route.params.id))

// ── Snackbar ──────────────────────────────────────────────────────
const snackbar = ref({ show: false, message: '', color: 'success' })
const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

// ── Confirm dialog ────────────────────────────────────────────────
const confirmDialog = ref({ show: false, title: '', message: '', onConfirm: () => {} })
const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  confirmDialog.value = { show: true, title, message, onConfirm }
}

// ── Văn bản giao việc ─────────────────────────────────────────────
const currentDoc = ref<TaskAssignmentDocument | null>(null)
const isDocLoading = ref(false)

const fetchDocument = async () => {
  isDocLoading.value = true
  try {
    const res = await taskAssignmentDocumentApi.show(documentId.value)
    if (res.data.success)
      currentDoc.value = res.data.data || null
  }
  catch {
    showToast('Không tải được thông tin văn bản.', 'error')
  }
  finally { isDocLoading.value = false }
}

const isIssued = computed(() => currentDoc.value?.status === 'issued')

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '—'
  const normalized = dateStr.replace(' ', 'T')
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Form chỉnh sửa văn bản ────────────────────────────────────────
const refDocForm = ref<InstanceType<typeof VForm>>()
const isDocSubmitting = ref(false)
const docServerErrors = ref<Record<string, string[]>>({})
const docEditMode = ref(false)

const docForm = ref({
  name: '',
  summary: '',
  issue_date: '',
  task_assignment_type_id: null as number | null,
  status: 'draft' as 'draft' | 'issued',
})

const docStatusOptions = [
  { title: 'Bản nháp', value: 'draft' },
  { title: 'Ban hành', value: 'issued' },
]

// Infinity scroll loại văn bản
const typeOptions = ref<{ title: string; value: number }[]>([])
const typePage = ref(1)
const typeTotal = ref(0)
const typeLoading = ref(false)
const typeHasMore = computed(() => typeOptions.value.length < typeTotal.value)

const loadTypeOptions = async (reset = false) => {
  if (typeLoading.value) return
  if (reset) { typePage.value = 1; typeOptions.value = [] }
  typeLoading.value = true
  try {
    const res = await taskAssignmentTypeApi.list({ page: typePage.value, limit: 20, status: 'active' })
    if (res.data.success) {
      const newItems = (res.data.data || []).map((t: any) => ({ title: t.name, value: t.id }))
      typeOptions.value = reset ? newItems : [...typeOptions.value, ...newItems]
      typeTotal.value = res.data.meta?.total || 0
      typePage.value++
    }
  }
  catch { /* silent */ }
  finally { typeLoading.value = false }
}

const onTypeIntersect = (isIntersecting: boolean) => {
  if (isIntersecting && typeHasMore.value && !typeLoading.value)
    loadTypeOptions()
}

const buildDocForm = () => ({
  name: currentDoc.value?.name || '',
  summary: currentDoc.value?.summary || '',
  issue_date: currentDoc.value?.issue_date || '',
  task_assignment_type_id: currentDoc.value?.task_assignment_type_id || null,
  status: (currentDoc.value?.status || 'draft') as 'draft' | 'issued',
})

const openDocEdit = () => {
  docForm.value = buildDocForm()
  docServerErrors.value = {}
  docEditMode.value = true
  loadTypeOptions(true)
}

const cancelDocEdit = () => {
  docEditMode.value = false
  docServerErrors.value = {}
}

const requiredRule = (v: any) => !!v?.toString().trim() || 'Trường này là bắt buộc'
const docServerErrorRule = (field: string) => () => {
  const errors = docServerErrors.value[field]
  return !errors?.length || errors[0]
}

const saveDoc = async () => {
  docServerErrors.value = {}
  if (!refDocForm.value) return
  const { valid } = await refDocForm.value.validate()
  if (!valid) return

  isDocSubmitting.value = true
  try {
    const payload = {
      name: docForm.value.name,
      summary: docForm.value.summary || undefined,
      issue_date: normalizeDate(docForm.value.issue_date) || undefined,
      task_assignment_type_id: docForm.value.task_assignment_type_id || undefined,
      status: docForm.value.status,
    }
    const res = await taskAssignmentDocumentApi.update(documentId.value, payload)
    if (res.data.success) {
      currentDoc.value = res.data.data || currentDoc.value
      showToast('Cập nhật văn bản thành công!', 'success')
      docEditMode.value = false
    }
  }
  catch (error: any) {
    if (error?.response?.status === 403) { showToast('Người dùng không có quyền.', 'error'); return }
    const responseData = error?.response?.data
    if (responseData?.errors) {
      docServerErrors.value = responseData.errors
      await nextTick()
      await refDocForm.value?.validate()
      showToast('Vui lòng kiểm tra lại thông tin nhập.', 'error')
    }
    else { showToast(getErrorMessage(error, 'Có lỗi xảy ra, vui lòng thử lại.'), 'error') }
  }
  finally { isDocSubmitting.value = false }
}

// ── Attachments ───────────────────────────────────────────────────
const existingAttachments = ref<TaskAssignmentDocumentAttachment[]>([])
const pendingFiles = ref<File[]>([])
const isUploading = ref(false)
const deletingAttachmentId = ref<number | null>(null)
const fileInputRef = ref<HTMLInputElement>()

watch(() => currentDoc.value, doc => {
  existingAttachments.value = doc?.attachments ?? []
}, { immediate: true })

const openFilePicker = () => fileInputRef.value?.click()

const onFileSelected = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  for (const file of Array.from(input.files))
    pendingFiles.value.push(file)
  input.value = ''
}

const removePending = (index: number) => pendingFiles.value.splice(index, 1)

const formatFileSize = (bytes?: number) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const getFileIcon = (mimeType?: string, fileName?: string) => {
  const name = (fileName ?? '').toLowerCase()
  const mime = (mimeType ?? '').toLowerCase()
  if (mime.startsWith('image/')) return 'tabler-photo'
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'tabler-file-type-pdf'
  if (mime.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return 'tabler-file-type-doc'
  if (mime.includes('excel') || mime.includes('spreadsheet') || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'tabler-file-type-xls'
  if (mime.includes('zip') || mime.includes('rar') || name.endsWith('.zip') || name.endsWith('.rar')) return 'tabler-file-zip'
  return 'tabler-file'
}

const handleUpload = async () => {
  if (!pendingFiles.value.length) return
  isUploading.value = true
  try {
    const res = await taskAssignmentDocumentApi.addAttachments(documentId.value, pendingFiles.value)
    if (res.data.success) {
      existingAttachments.value = res.data.data?.attachments ?? []
      if (currentDoc.value) currentDoc.value.attachments = existingAttachments.value
    }
    pendingFiles.value = []
    showToast('Tải file lên thành công!', 'success')
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Tải file thất bại!'), 'error')
  }
  finally { isUploading.value = false }
}

const handleRemoveAttachment = async (att: TaskAssignmentDocumentAttachment) => {
  showConfirm('Xóa file', `Bạn có chắc muốn xóa file "${att.file_name || att.name}"?`, async () => {
    deletingAttachmentId.value = att.id
    try {
      await taskAssignmentDocumentApi.removeAttachment(documentId.value, att.id)
      existingAttachments.value = existingAttachments.value.filter(a => a.id !== att.id)
      if (currentDoc.value) currentDoc.value.attachments = existingAttachments.value
      showToast('Xóa file thành công!', 'success')
    }
    catch (err: any) {
      showToast(getErrorMessage(err, 'Xóa file thất bại!'), 'error')
    }
    finally { deletingAttachmentId.value = null }
  })
}

// ── Danh sách công việc ───────────────────────────────────────────
const items = ref<TaskAssignmentItem[]>([])
const itemsTotal = ref(0)
const isItemsLoading = ref(false)
const itemsPage = ref(1)
const itemsLimit = ref(15)
const itemsSearch = ref('')
const itemsStatusFilter = ref<string | null>(null)

let searchTimeout: ReturnType<typeof setTimeout>

const fetchItems = async () => {
  isItemsLoading.value = true
  try {
    const res = await taskAssignmentItemApi.list({
      task_assignment_document_id: documentId.value,
      page: itemsPage.value,
      limit: itemsLimit.value,
      search: itemsSearch.value || undefined,
      processing_status: itemsStatusFilter.value as any || undefined,
      sort_by: 'created_at',
      sort_order: 'desc',
    })
    if (res.data.success) {
      items.value = res.data.data || []
      itemsTotal.value = res.data.meta?.total || 0
    }
  }
  catch { /* silent */ }
  finally { isItemsLoading.value = false }
}

const onSearchChange = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { itemsPage.value = 1; fetchItems() }, 400)
}

const onStatusFilterChange = () => { itemsPage.value = 1; fetchItems() }

const indexOffset = computed(() => (itemsPage.value - 1) * itemsLimit.value)

const resolveStatusColor = (s: string) => ({ todo: 'default', in_progress: 'info', done: 'success', overdue: 'error', paused: 'warning', cancelled: 'secondary' }[s] || 'default')
const resolveStatusLabel = (s: string) => ({ todo: 'Chưa bắt đầu', in_progress: 'Đang thực hiện', done: 'Hoàn thành', overdue: 'Quá hạn', paused: 'Tạm dừng', cancelled: 'Đã hủy' }[s] || s)
const resolvePriorityColor = (p: string) => ({ low: 'default', medium: 'info', high: 'warning', urgent: 'error' }[p] || 'default')
const resolvePriorityLabel = (p: string) => ({ low: 'Thấp', medium: 'Bình thường', high: 'Cao', urgent: 'Khẩn cấp' }[p] || p)

const statusOptions = [
  { title: 'Chưa bắt đầu', value: 'todo' },
  { title: 'Đang thực hiện', value: 'in_progress' },
  { title: 'Hoàn thành', value: 'done' },
  { title: 'Quá hạn', value: 'overdue' },
  { title: 'Tạm dừng', value: 'paused' },
  { title: 'Đã hủy', value: 'cancelled' },
]

// ── Xóa công việc ────────────────────────────────────────────────
const isDeletingItem = ref<number | null>(null)

const confirmDeleteItem = (item: TaskAssignmentItem) => {
  showConfirm('Xóa công việc', `Bạn có chắc muốn xóa công việc "${item.name}"?`, async () => {
    isDeletingItem.value = item.id
    try {
      await taskAssignmentItemApi.delete(item.id)
      showToast('Đã xóa công việc thành công!', 'success')
      await fetchItems()
    }
    catch (err: any) {
      showToast(getErrorMessage(err, 'Xóa công việc thất bại!'), 'error')
    }
    finally { isDeletingItem.value = null }
  })
}

// ── Drawer thêm/sửa công việc ─────────────────────────────────────
const itemDrawerOpen = ref(false)
const editingItem = ref<TaskAssignmentItem | null>(null)
const refItemForm = ref<InstanceType<typeof VForm>>()
const isItemSubmitting = ref(false)
const itemServerErrors = ref<Record<string, string[]>>({})

// --- Loại công việc (infinity scroll) ---
const itemTypeOptions = ref<{ title: string; value: number }[]>([])
const itemTypePage = ref(1)
const itemTypeTotal = ref(0)
const itemTypeLoading = ref(false)
const itemTypeHasMore = computed(() => itemTypeOptions.value.length < itemTypeTotal.value)

const loadItemTypeOptions = async (reset = false) => {
  if (itemTypeLoading.value) return
  if (reset) { itemTypePage.value = 1; itemTypeOptions.value = [] }
  itemTypeLoading.value = true
  try {
    const res = await taskAssignmentItemTypeApi.list({ page: itemTypePage.value, limit: 20, status: 'active' })
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
  if (isIntersecting && itemTypeHasMore.value && !itemTypeLoading.value) loadItemTypeOptions()
}

// --- Phòng ban ---
const departmentOptions = ref<{ title: string; value: number }[]>([])
const departmentLoading = ref(false)

const loadDepartmentOptions = async () => {
  departmentLoading.value = true
  try {
    const res = await taskAssignmentDepartmentApi.list({ limit: 100, status: 'active' })
    if (res.data.success)
      departmentOptions.value = (res.data.data || []).map((d: any) => ({ title: d.name, value: d.id }))
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
    const res = await userApi.list({ limit: 100 })
    if (res.data.success)
      userOptions.value = (res.data.data || []).map((u: any) => ({ title: u.name, value: u.id }))
  }
  catch { /* silent */ }
  finally { userLoading.value = false }
}

const buildEmptyItemForm = () => ({
  name: '',
  task_assignment_item_type_id: null as number | null,
  deadline_type: 'has_deadline' as 'has_deadline' | 'no_deadline',
  start_at: '',
  end_at: '',
  priority: 'medium' as string,
  processing_status: 'todo' as string,
  completion_percent: 0,
  description: '',
  department_ids: [] as TaskAssignmentItemDepartmentPayload[],
  user_assignments: [] as TaskAssignmentItemUserPayload[],
})

const itemForm = ref(buildEmptyItemForm())

const isEditItemMode = computed(() => !!editingItem.value?.id)
const hasDeadline = computed(() => itemForm.value.deadline_type === 'has_deadline')
const drawerTitle = computed(() => isEditItemMode.value ? 'Chỉnh sửa công việc' : 'Thêm công việc mới')

const itemRequiredRule = (v: any) => (v !== null && v !== undefined && v !== '') || 'Trường này là bắt buộc'
const itemServerErrorRule = (field: string) => () => {
  const errors = itemServerErrors.value[field]
  return !errors?.length || errors[0]
}

const onItemStatusChange = (val: string) => {
  if (val === 'done') itemForm.value.completion_percent = 100
}
const onItemPercentChange = (val: number) => {
  if (val >= 100 && itemForm.value.processing_status !== 'done') itemForm.value.processing_status = 'done'
  else if (val < 100 && itemForm.value.processing_status === 'done') itemForm.value.processing_status = 'in_progress'
}

const addDepartment = () => itemForm.value.department_ids.push({ department_id: '' as any, role: 'main' })
const removeDepartment = (idx: number) => itemForm.value.department_ids.splice(idx, 1)
const addUserAssignment = () => itemForm.value.user_assignments.push({ user_id: null as any, department_id: null as any, assignment_role: 'main', assignment_status: 'assigned', note: '' })
const removeUserAssignment = (idx: number) => itemForm.value.user_assignments.splice(idx, 1)

const openAddItemDrawer = () => {
  editingItem.value = null
  itemForm.value = buildEmptyItemForm()
  itemServerErrors.value = {}
  itemDrawerOpen.value = true
}

const openEditItemDrawer = (item: TaskAssignmentItem) => {
  editingItem.value = item
  itemForm.value = {
    name: item.name || '',
    task_assignment_item_type_id: item.task_assignment_item_type_id || null,
    deadline_type: item.deadline_type || 'has_deadline',
    start_at: item.start_at || '',
    end_at: item.end_at || '',
    priority: item.priority || 'medium',
    processing_status: item.processing_status || 'todo',
    completion_percent: item.completion_percent ?? 0,
    description: item.description || '',
    department_ids: (item.departments || []).map(d => ({ department_id: d.id, role: d.role as 'main' | 'cooperate' })),
    user_assignments: (item.users || []).map(u => ({
      user_id: u.id,
      department_id: u.department_id,
      assignment_role: u.assignment_role as 'main' | 'support',
      assignment_status: u.assignment_status as 'assigned' | 'accepted' | 'rejected' | 'done',
      note: u.note || '',
    })),
  }
  itemServerErrors.value = {}
  itemDrawerOpen.value = true
}

watch(itemDrawerOpen, val => {
  if (val) {
    loadItemTypeOptions(true)
    loadDepartmentOptions()
    loadUserOptions()
  }
  else {
    itemForm.value = buildEmptyItemForm()
    itemServerErrors.value = {}
    refItemForm.value?.resetValidation()
  }
})

const onItemSubmit = async () => {
  itemServerErrors.value = {}
  if (!refItemForm.value) return
  const { valid } = await refItemForm.value.validate()
  if (!valid) return

  isItemSubmitting.value = true
  try {
    const payload: any = {
      task_assignment_document_id: documentId.value,
      name: itemForm.value.name,
      description: itemForm.value.description || undefined,
      task_assignment_item_type_id: itemForm.value.task_assignment_item_type_id || undefined,
      deadline_type: itemForm.value.deadline_type,
      start_at: itemForm.value.start_at || undefined,
      end_at: hasDeadline.value ? (itemForm.value.end_at || undefined) : undefined,
      priority: itemForm.value.priority || undefined,
      processing_status: itemForm.value.processing_status,
      completion_percent: itemForm.value.completion_percent,
      department_ids: itemForm.value.department_ids.filter(d => d.department_id),
      user_assignments: itemForm.value.user_assignments
        .filter(u => u.user_id && u.department_id)
        .map(u => ({
          user_id: u.user_id,
          department_id: u.department_id,
          assignment_role: u.assignment_role,
          assignment_status: u.assignment_status || 'assigned',
          note: u.note || undefined,
        })),
    }

    if (isEditItemMode.value && editingItem.value)
      await taskAssignmentItemApi.update(editingItem.value.id, payload)
    else
      await taskAssignmentItemApi.create(payload)

    showToast(isEditItemMode.value ? 'Cập nhật công việc thành công!' : 'Thêm công việc thành công!', 'success')
    itemDrawerOpen.value = false
    await fetchItems()
  }
  catch (error: any) {
    if (error?.response?.status === 403) { showToast('Người dùng không có quyền.', 'error'); return }
    const responseData = error?.response?.data
    if (responseData?.errors) {
      itemServerErrors.value = responseData.errors
      await nextTick()
      await refItemForm.value?.validate()
      showToast('Vui lòng kiểm tra lại thông tin nhập.', 'error')
    }
    else { showToast(getErrorMessage(error, 'Có lỗi xảy ra, vui lòng thử lại.'), 'error') }
  }
  finally { isItemSubmitting.value = false }
}

const priorityOptions = [
  { title: 'Thấp', value: 'low' },
  { title: 'Bình thường', value: 'medium' },
  { title: 'Cao', value: 'high' },
  { title: 'Khẩn cấp', value: 'urgent' },
]

const deadlineTypeOptions = [
  { title: 'Có thời hạn', value: 'has_deadline' },
  { title: 'Không có thời hạn', value: 'no_deadline' },
]

const departmentRoleOptions = [
  { title: 'Chủ trì', value: 'main' },
  { title: 'Phối hợp', value: 'cooperate' },
]

const assignmentRoleOptions = [
  { title: 'Chủ trì', value: 'main' },
  { title: 'Phối hợp', value: 'support' },
]

const assignmentStatusOptions = [
  { title: 'Đã giao', value: 'assigned' },
  { title: 'Đã nhận', value: 'accepted' },
  { title: 'Từ chối', value: 'rejected' },
  { title: 'Hoàn thành', value: 'done' },
]

onMounted(async () => {
  await fetchDocument()
  await fetchItems()
})
</script>

<template>
  <div>
    <!-- ── Breadcrumb ─────────────────────────────────────────── -->
    <div class="d-flex align-center gap-2 mb-5">
      <VBtn
        variant="text"
        size="small"
        prepend-icon="tabler-arrow-left"
        @click="router.push({ name: 'task-assignment-documents' })"
      >
        Danh sách văn bản
      </VBtn>
      <VIcon icon="tabler-chevron-right" size="14" class="text-medium-emphasis" />
      <span class="text-body-1 font-weight-medium text-truncate">
        {{ currentDoc?.name || 'Chi tiết văn bản' }}
      </span>
    </div>

    <!-- ── Skeleton ───────────────────────────────────────────── -->
    <template v-if="isDocLoading">
      <VSkeletonLoader type="card" class="mb-4" />
    </template>

    <template v-else-if="currentDoc">
      <!-- ── Card thông tin văn bản ─────────────────────────────── -->
      <VCard class="mb-5">
        <VCardTitle class="pa-5 pb-3 d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <VIcon icon="tabler-file-text" color="primary" />
            <span>Thông tin văn bản</span>
          </div>
          <VBtn
            v-if="!docEditMode && !isIssued"
            variant="tonal"
            color="primary"
            size="small"
            prepend-icon="tabler-edit"
            @click="openDocEdit"
          >
            Chỉnh sửa
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-5">
          <!-- Chế độ xem -->
          <template v-if="!docEditMode">
            <VRow>
              <VCol cols="12" md="8">
                <VRow dense>
                  <VCol cols="12">
                    <div class="text-xs text-medium-emphasis mb-1">Tên văn bản</div>
                    <div class="text-body-1 font-weight-medium">{{ currentDoc.name }}</div>
                  </VCol>
                  <VCol cols="12" sm="6" class="mt-3">
                    <div class="text-xs text-medium-emphasis mb-1">Loại văn bản</div>
                    <div class="text-body-2">{{ currentDoc.type?.name || '—' }}</div>
                  </VCol>
                  <VCol cols="12" sm="6" class="mt-3">
                    <div class="text-xs text-medium-emphasis mb-1">Trạng thái</div>
                    <VChip :color="currentDoc.status === 'issued' ? 'success' : 'warning'" size="small" variant="tonal">
                      {{ currentDoc.status === 'issued' ? 'Ban hành' : 'Bản nháp' }}
                    </VChip>
                  </VCol>
                  <VCol cols="12" sm="6" class="mt-3">
                    <div class="text-xs text-medium-emphasis mb-1">Ngày ban hành</div>
                    <div class="text-body-2">{{ formatDate(currentDoc.issue_date) }}</div>
                  </VCol>
                  <VCol cols="12" sm="6" class="mt-3">
                    <div class="text-xs text-medium-emphasis mb-1">Thời điểm ban hành</div>
                    <div class="text-body-2">{{ formatDate(currentDoc.issued_at) }}</div>
                  </VCol>
                  <VCol cols="12" sm="6" class="mt-3">
                    <div class="text-xs text-medium-emphasis mb-1">Người tạo</div>
                    <div class="text-body-2">{{ currentDoc.created_by || '—' }}</div>
                  </VCol>
                  <VCol cols="12" sm="6" class="mt-3">
                    <div class="text-xs text-medium-emphasis mb-1">Ngày tạo</div>
                    <div class="text-body-2">{{ formatDate(currentDoc.created_at) }}</div>
                  </VCol>
                  <VCol v-if="currentDoc.summary" cols="12" class="mt-3">
                    <div class="text-xs text-medium-emphasis mb-1">Tóm tắt nội dung</div>
                    <div class="text-body-2" style="white-space: pre-wrap;">{{ currentDoc.summary }}</div>
                  </VCol>
                </VRow>
              </VCol>

              <!-- File đính kèm -->
              <VCol cols="12" md="4">
                <div class="text-caption text-medium-emphasis mb-3 text-uppercase font-weight-medium">
                  Tệp đính kèm
                </div>

                <!-- Input ẩn -->
                <input ref="fileInputRef" type="file" multiple style="display: none;" @change="onFileSelected">

                <!-- File đã lưu -->
                <div v-if="existingAttachments.length > 0" class="mb-3">
                  <div class="text-caption text-medium-emphasis mb-2">
                    Đã đính kèm ({{ existingAttachments.length }})
                  </div>
                  <VList density="compact" rounded="lg" border>
                    <VListItem v-for="att in existingAttachments" :key="att.id" class="py-2">
                      <template #prepend>
                        <VIcon :icon="getFileIcon(att.mime_type, att.file_name)" size="20" color="primary" class="me-2" />
                      </template>
                      <VListItemTitle class="text-body-2">
                        <a v-if="att.url" :href="att.url" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
                          {{ att.file_name || att.name }}
                        </a>
                        <span v-else>{{ att.file_name || att.name }}</span>
                      </VListItemTitle>
                      <VListItemSubtitle v-if="att.size" class="text-caption">
                        {{ formatFileSize(att.size) }}
                      </VListItemSubtitle>
                      <template #append>
                        <IconBtn
                          v-if="!isIssued"
                          size="small"
                          color="error"
                          :loading="deletingAttachmentId === att.id"
                          @click="handleRemoveAttachment(att)"
                        >
                          <VIcon icon="tabler-trash" size="16" />
                          <VTooltip activator="parent" location="top">Xóa</VTooltip>
                        </IconBtn>
                      </template>
                    </VListItem>
                  </VList>
                </div>

                <div v-else-if="!pendingFiles.length" class="text-center py-6 text-disabled">
                  <VIcon icon="tabler-paperclip" size="40" class="mb-2 d-block mx-auto" />
                  <div class="text-body-2">Chưa có tệp đính kèm nào</div>
                </div>

                <!-- File chờ upload -->
                <div v-if="pendingFiles.length > 0" class="mb-3">
                  <div class="text-caption text-medium-emphasis mb-2">
                    Chờ tải lên ({{ pendingFiles.length }})
                  </div>
                  <VList density="compact" rounded="lg" border>
                    <VListItem v-for="(file, idx) in pendingFiles" :key="idx" class="py-2">
                      <template #prepend>
                        <VIcon :icon="getFileIcon(file.type, file.name)" size="20" color="secondary" class="me-2" />
                      </template>
                      <VListItemTitle class="text-body-2">{{ file.name }}</VListItemTitle>
                      <VListItemSubtitle class="text-caption">{{ formatFileSize(file.size) }}</VListItemSubtitle>
                      <template #append>
                        <IconBtn size="small" color="error" @click="removePending(idx)">
                          <VIcon icon="tabler-x" size="16" />
                          <VTooltip activator="parent" location="top">Bỏ chọn</VTooltip>
                        </IconBtn>
                      </template>
                    </VListItem>
                  </VList>
                </div>

                <!-- Actions file -->
                <div v-if="!isIssued" class="d-flex gap-2 mt-2">
                  <VBtn variant="tonal" color="secondary" size="small" prepend-icon="tabler-plus" @click="openFilePicker">
                    Thêm file
                  </VBtn>
                  <VBtn
                    v-if="pendingFiles.length > 0"
                    size="small"
                    prepend-icon="tabler-upload"
                    :loading="isUploading"
                    @click="handleUpload"
                  >
                    Tải lên ({{ pendingFiles.length }})
                  </VBtn>
                </div>
              </VCol>
            </VRow>
          </template>

          <!-- Chế độ chỉnh sửa -->
          <template v-else>
            <VForm ref="refDocForm">
              <VRow>
                <VCol cols="12" md="8">
                  <VRow>
                    <VCol cols="12">
                      <AppTextField
                        v-model="docForm.name"
                        label="Tên văn bản giao việc *"
                        placeholder="Nhập tên văn bản giao việc"
                        :rules="[requiredRule, docServerErrorRule('name')]"
                      />
                    </VCol>
                    <VCol cols="12">
                      <div class="v-label mb-1 text-body-2">Loại văn bản</div>
                      <VAutocomplete
                        v-model="docForm.task_assignment_type_id"
                        placeholder="Chọn loại văn bản..."
                        :items="typeOptions"
                        :loading="typeLoading"
                        item-title="title"
                        item-value="value"
                        clearable
                        :rules="[docServerErrorRule('task_assignment_type_id')]"
                      >
                        <template #append-item>
                          <div
                            v-if="typeHasMore || typeLoading"
                            v-intersect="{ handler: onTypeIntersect, options: { threshold: 0.5 } }"
                            class="d-flex justify-center pa-2"
                          >
                            <VProgressCircular v-if="typeLoading" indeterminate size="18" width="2" />
                          </div>
                        </template>
                      </VAutocomplete>
                    </VCol>
                    <VCol cols="12" sm="6">
                      <AppDateTimePicker
                        v-model="docForm.issue_date"
                        label="Ngày ban hành"
                        :config="{ dateFormat: 'd/m/Y' }"
                        :rules="[docServerErrorRule('issue_date')]"
                      />
                    </VCol>
                    <VCol cols="12" sm="6">
                      <AppSelect
                        v-model="docForm.status"
                        label="Trạng thái *"
                        :items="docStatusOptions"
                        :rules="[requiredRule, docServerErrorRule('status')]"
                      />
                    </VCol>
                    <VCol cols="12">
                      <AppTextarea
                        v-model="docForm.summary"
                        label="Tóm tắt nội dung"
                        placeholder="Nhập tóm tắt nội dung văn bản"
                        rows="4"
                        :rules="[docServerErrorRule('summary')]"
                      />
                    </VCol>
                  </VRow>
                </VCol>

                <!-- File khi edit -->
                <VCol cols="12" md="4">
                  <div class="text-caption text-medium-emphasis mb-3 text-uppercase font-weight-medium">
                    Tệp đính kèm
                  </div>
                  <input ref="fileInputRef" type="file" multiple style="display: none;" @change="onFileSelected">

                  <div v-if="existingAttachments.length > 0" class="mb-3">
                    <div class="text-caption text-medium-emphasis mb-2">Đã đính kèm ({{ existingAttachments.length }})</div>
                    <VList density="compact" rounded="lg" border>
                      <VListItem v-for="att in existingAttachments" :key="att.id" class="py-2">
                        <template #prepend>
                          <VIcon :icon="getFileIcon(att.mime_type, att.file_name)" size="20" color="primary" class="me-2" />
                        </template>
                        <VListItemTitle class="text-body-2">
                          <a v-if="att.url" :href="att.url" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
                            {{ att.file_name || att.name }}
                          </a>
                          <span v-else>{{ att.file_name || att.name }}</span>
                        </VListItemTitle>
                        <VListItemSubtitle v-if="att.size" class="text-caption">{{ formatFileSize(att.size) }}</VListItemSubtitle>
                        <template #append>
                          <IconBtn size="small" color="error" :loading="deletingAttachmentId === att.id" @click="handleRemoveAttachment(att)">
                            <VIcon icon="tabler-trash" size="16" />
                            <VTooltip activator="parent" location="top">Xóa</VTooltip>
                          </IconBtn>
                        </template>
                      </VListItem>
                    </VList>
                  </div>

                  <div v-else-if="!pendingFiles.length" class="text-center py-6 text-disabled">
                    <VIcon icon="tabler-paperclip" size="40" class="mb-2 d-block mx-auto" />
                    <div class="text-body-2">Chưa có tệp đính kèm nào</div>
                  </div>

                  <div v-if="pendingFiles.length > 0" class="mb-3">
                    <div class="text-caption text-medium-emphasis mb-2">Chờ tải lên ({{ pendingFiles.length }})</div>
                    <VList density="compact" rounded="lg" border>
                      <VListItem v-for="(file, idx) in pendingFiles" :key="idx" class="py-2">
                        <template #prepend>
                          <VIcon :icon="getFileIcon(file.type, file.name)" size="20" color="secondary" class="me-2" />
                        </template>
                        <VListItemTitle class="text-body-2">{{ file.name }}</VListItemTitle>
                        <VListItemSubtitle class="text-caption">{{ formatFileSize(file.size) }}</VListItemSubtitle>
                        <template #append>
                          <IconBtn size="small" color="error" @click="removePending(idx)">
                            <VIcon icon="tabler-x" size="16" />
                            <VTooltip activator="parent" location="top">Bỏ chọn</VTooltip>
                          </IconBtn>
                        </template>
                      </VListItem>
                    </VList>
                  </div>

                  <div class="d-flex gap-2 mt-2">
                    <VBtn variant="tonal" color="secondary" size="small" prepend-icon="tabler-plus" @click="openFilePicker">
                      Thêm file
                    </VBtn>
                    <VBtn
                      v-if="pendingFiles.length > 0"
                      size="small"
                      prepend-icon="tabler-upload"
                      :loading="isUploading"
                      @click="handleUpload"
                    >
                      Tải lên ({{ pendingFiles.length }})
                    </VBtn>
                  </div>
                </VCol>

                <VCol cols="12">
                  <VDivider class="mb-4" />
                  <div class="d-flex gap-3">
                    <VBtn color="primary" :loading="isDocSubmitting" @click="saveDoc">Lưu thay đổi</VBtn>
                    <VBtn variant="tonal" color="secondary" @click="cancelDocEdit">Hủy</VBtn>
                  </div>
                </VCol>
              </VRow>
            </VForm>
          </template>
        </VCardText>
      </VCard>

      <!-- ── Danh sách công việc ─────────────────────────────── -->
      <VCard>
        <VCardTitle class="pa-5 pb-3 d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="d-flex align-center gap-2">
            <VIcon icon="tabler-checklist" color="primary" />
            <span>Danh sách công việc</span>
            <VChip size="small" color="primary" variant="tonal">{{ itemsTotal }}</VChip>
          </div>

          <div class="d-flex align-center gap-2 flex-wrap">
            <AppTextField
              v-model="itemsSearch"
              placeholder="Tìm tên công việc..."
              prepend-inner-icon="tabler-search"
              clearable
              hide-details
              style="min-width: 200px;"
              @update:model-value="onSearchChange"
            />
            <AppSelect
              v-model="itemsStatusFilter"
              :items="statusOptions"
              placeholder="Trạng thái"
              clearable
              hide-details
              style="min-width: 160px;"
              @update:model-value="onStatusFilterChange"
            />
            <VBtn
              v-if="!isIssued"
              color="primary"
              prepend-icon="tabler-plus"
              @click="openAddItemDrawer"
            >
              Thêm mới
            </VBtn>
          </div>
        </VCardTitle>

        <VDivider />

        <VDataTableServer
          :headers="[
            { title: 'STT', key: 'index', sortable: false, align: 'center' as const, width: '60px', minWidth: '60px' },
            { title: 'Tên công việc', key: 'name', sortable: false, align: 'start' as const, minWidth: '220px' },
            { title: 'Phòng ban', key: 'departments', sortable: false, align: 'start' as const, minWidth: '140px' },
            { title: 'Người thực hiện', key: 'users', sortable: false, align: 'start' as const, minWidth: '160px' },
            { title: 'Trạng thái', key: 'processing_status', sortable: false, align: 'start' as const, width: '150px', minWidth: '150px' },
            { title: 'Ưu tiên', key: 'priority', sortable: false, align: 'start' as const, width: '120px', minWidth: '120px' },
            { title: 'Thời hạn', key: 'end_at', sortable: false, align: 'start' as const, width: '130px', minWidth: '130px' },
            { title: '% Hoàn thành', key: 'completion_percent', sortable: false, align: 'center' as const, width: '90px', minWidth: '90px' },
            { title: 'Hành động', key: 'actions', sortable: false, align: 'start' as const, width: '100px', minWidth: '100px' },
          ]"
          :items="items"
          :items-length="itemsTotal"
          :loading="isItemsLoading"
          item-value="id"
          item-height="64"
          class="text-no-wrap"
          hide-default-footer
        >
          <template #item.index="{ index }">
            <span class="text-body-1 text-high-emphasis">{{ indexOffset + index + 1 }}</span>
          </template>

          <template #item.name="{ item }">
            <div class="d-flex flex-column">
              <span class="text-base font-weight-medium text-high-emphasis">{{ item.name }}</span>
              <span v-if="item.item_type" class="text-xs text-disabled">{{ item.item_type.name }}</span>
            </div>
          </template>

          <template #item.departments="{ item }">
            <div v-if="item.departments && item.departments.length" class="d-flex flex-wrap gap-1">
              <VChip v-for="dept in item.departments" :key="dept.id" variant="tonal">
                {{ dept.name }}
              </VChip>
            </div>
            <span v-else class="text-xs text-disabled">—</span>
          </template>

          <template #item.users="{ item }">
            <div v-if="item.users && item.users.length" class="d-flex flex-column gap-1">
              <div v-for="u in item.users.slice(0, 2)" :key="u.id" class="d-flex align-center gap-1">
                <VIcon
                  :icon="u.assignment_role === 'main' ? 'tabler-user' : 'tabler-users'"
                  size="14"
                  :class="u.assignment_role === 'main' ? 'text-primary' : 'text-secondary'"
                />
                <span class="text-sm">{{ u.name }}</span>
              </div>
              <span v-if="item.users.length > 2" class="text-xs text-disabled">
                +{{ item.users.length - 2 }} người khác
              </span>
            </div>
            <span v-else class="text-xs text-disabled">—</span>
          </template>

          <template #item.processing_status="{ item }">
            <VChip :color="resolveStatusColor(item.processing_status)" size="small" variant="tonal">
              {{ resolveStatusLabel(item.processing_status) }}
            </VChip>
          </template>

          <template #item.priority="{ item }">
            <VChip v-if="item.priority" :color="resolvePriorityColor(item.priority)" size="small" variant="tonal">
              {{ resolvePriorityLabel(item.priority) }}
            </VChip>
            <span v-else class="text-xs text-disabled">—</span>
          </template>

          <template #item.end_at="{ item }">
            <span v-if="item.end_at && item.deadline_type !== 'no_deadline'" class="text-sm">
              {{ formatDate(item.end_at) }}
            </span>
            <span v-else class="text-sm text-disabled">Không có thời hạn</span>
          </template>

          <template #item.completion_percent="{ item }">
            <div class="d-flex flex-column align-center gap-1">
              <span class="text-base font-weight-medium text-high-emphasis">{{ item.completion_percent }}%</span>
            </div>
          </template>

          <template #item.actions="{ item }">
            <IconBtn @click="openEditItemDrawer(item)">
              <VIcon :icon="isIssued ? 'tabler-eye' : 'tabler-edit'" />
            </IconBtn>
            <IconBtn
              v-if="!isIssued"
              color="error"
              :loading="isDeletingItem === item.id"
              @click="confirmDeleteItem(item)"
            >
              <VIcon icon="tabler-trash" />
            </IconBtn>
          </template>

          <template #no-data>
            <div class="text-center py-8">
              <VIcon icon="tabler-checklist" size="48" color="disabled" class="mb-4" />
              <div class="text-sm text-disabled mb-3">
                Chưa có công việc nào trong văn bản này
              </div>
              <VBtn v-if="!isIssued" color="primary" prepend-icon="tabler-plus" @click="openAddItemDrawer">
                Thêm công việc đầu tiên
              </VBtn>
            </div>
          </template>

          <template #bottom>
            <AppPagination
              :total="itemsTotal"
              :page="itemsPage"
              :limit="itemsLimit"
              @update:page="(p) => { itemsPage = p; fetchItems() }"
              @update:limit="(l) => { itemsLimit = l; itemsPage = 1; fetchItems() }"
            />
          </template>
        </VDataTableServer>
      </VCard>
    </template>

    <!-- ── Không tìm thấy ─────────────────────────────────────── -->
    <VCard v-else-if="!isDocLoading" class="text-center pa-12">
      <VIcon icon="tabler-file-off" size="64" color="disabled" class="mb-4" />
      <div class="text-h6 text-medium-emphasis mb-2">Không tìm thấy văn bản giao việc</div>
      <VBtn variant="tonal" @click="router.push({ name: 'task-assignment-documents' })">
        Quay lại danh sách
      </VBtn>
    </VCard>

    <!-- ── Drawer thêm / sửa công việc ───────────────────────── -->
    <VNavigationDrawer
      v-model="itemDrawerOpen"
      temporary
      location="end"
      width="620"
    >
      <div class="d-flex flex-column h-100">
        <AppDrawerHeaderSection
          :title="drawerTitle"
          @cancel="itemDrawerOpen = false"
        />

        <VDivider />

        <PerfectScrollbar :options="{ wheelPropagation: false }" class="flex-grow-1" style="overflow-y: auto;">
          <VCardText>
            <VForm ref="refItemForm">
              <VRow>
                <!-- Tên công việc -->
                <VCol cols="12">
                  <AppTextField
                    v-model="itemForm.name"
                    label="Tên công việc *"
                    placeholder="Nhập tên công việc"
                    :readonly="isIssued"
                    :rules="[itemRequiredRule, itemServerErrorRule('name')]"
                  />
                </VCol>

                <!-- Loại công việc -->
                <VCol cols="12">
                  <div class="v-label mb-1 text-body-2">Loại công việc</div>
                  <VAutocomplete
                    v-model="itemForm.task_assignment_item_type_id"
                    placeholder="Chọn loại công việc..."
                    :items="itemTypeOptions"
                    :loading="itemTypeLoading"
                    item-title="title"
                    item-value="value"
                    clearable
                    :readonly="isIssued"
                    :rules="[itemServerErrorRule('task_assignment_item_type_id')]"
                  >
                    <template #append-item>
                      <div
                        v-if="itemTypeHasMore || itemTypeLoading"
                        v-intersect="{ handler: onItemTypeIntersect, options: { threshold: 0.5 } }"
                        class="d-flex justify-center pa-2"
                      >
                        <VProgressCircular v-if="itemTypeLoading" indeterminate size="18" width="2" />
                      </div>
                    </template>
                  </VAutocomplete>
                </VCol>

                <!-- Mô tả -->
                <VCol cols="12">
                  <AppTextarea
                    v-model="itemForm.description"
                    label="Mô tả"
                    placeholder="Nhập mô tả chi tiết công việc"
                    rows="3"
                    :readonly="isIssued"
                    :rules="[itemServerErrorRule('description')]"
                  />
                </VCol>

                <!-- Loại thời hạn + Ưu tiên -->
                <VCol cols="12" md="6">
                  <AppSelect
                    v-model="itemForm.deadline_type"
                    label="Loại thời hạn *"
                    :items="deadlineTypeOptions"
                    :readonly="isIssued"
                    :rules="[itemRequiredRule, itemServerErrorRule('deadline_type')]"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <AppSelect
                    v-model="itemForm.priority"
                    label="Mức độ ưu tiên"
                    :items="priorityOptions"
                    :readonly="isIssued"
                    :rules="[itemServerErrorRule('priority')]"
                  />
                </VCol>

                <!-- Ngày bắt đầu / kết thúc -->
                <VCol cols="12" md="6">
                  <AppDateTimePicker
                    v-model="itemForm.start_at"
                    label="Ngày bắt đầu"
                    :config="{ dateFormat: 'd/m/Y' }"
                    :readonly="isIssued"
                    :rules="[itemServerErrorRule('start_at')]"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <AppDateTimePicker
                    v-model="itemForm.end_at"
                    label="Ngày kết thúc"
                    :disabled="!hasDeadline"
                    :readonly="isIssued"
                    :config="{ dateFormat: 'd/m/Y' }"
                    :rules="[itemServerErrorRule('end_at')]"
                  />
                  <div v-if="!hasDeadline" class="text-caption text-disabled mt-1">
                    Không áp dụng khi chọn "Không có thời hạn"
                  </div>
                </VCol>

                <!-- Trạng thái + % hoàn thành -->
                <VCol cols="12" md="6">
                  <AppSelect
                    v-model="itemForm.processing_status"
                    label="Trạng thái"
                    :items="statusOptions"
                    :readonly="isIssued"
                    :rules="[itemServerErrorRule('processing_status')]"
                    @update:model-value="onItemStatusChange"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <AppTextField
                    v-model.number="itemForm.completion_percent"
                    label="% Hoàn thành"
                    type="number"
                    :min="0"
                    :max="100"
                    :readonly="isIssued"
                    :rules="[itemServerErrorRule('completion_percent')]"
                    @update:model-value="onItemPercentChange"
                  />
                </VCol>

                <!-- Phòng ban thực hiện -->
                <VCol cols="12">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <span class="text-body-2 font-weight-medium">Phòng ban thực hiện</span>
                    <VBtn
                      v-if="!isIssued"
                      size="small"
                      variant="tonal"
                      prepend-icon="tabler-plus"
                      @click="addDepartment"
                    >
                      Thêm
                    </VBtn>
                  </div>

                  <div
                    v-if="itemForm.department_ids.length === 0"
                    class="text-body-2 text-disabled text-center py-4 border rounded"
                  >
                    Chưa có phòng ban nào
                  </div>

                  <VCard
                    v-for="(dept, index) in itemForm.department_ids"
                    :key="index"
                    variant="outlined"
                    class="mb-3 pa-3"
                  >
                    <div class="d-flex align-center justify-space-between mb-2">
                      <span class="text-caption text-medium-emphasis">Phòng ban {{ index + 1 }}</span>
                      <VBtn
                        v-if="!isIssued"
                        icon
                        size="x-small"
                        variant="text"
                        color="error"
                        @click="removeDepartment(index)"
                      >
                        <VIcon icon="tabler-trash" size="14" />
                      </VBtn>
                    </div>
                    <VRow dense>
                      <VCol cols="12">
                        <div class="app-text-field">
                          <label class="v-label mb-1 text-body-2">Phòng ban</label>
                        </div>
                        <VAutocomplete
                          v-model="dept.department_id"
                          placeholder="Chọn phòng ban..."
                          :items="departmentOptions"
                          :loading="departmentLoading"
                          item-title="title"
                          item-value="value"
                          clearable
                          :readonly="isIssued"
                        />
                      </VCol>
                      <VCol cols="12">
                        <div class="app-text-field">
                          <label class="v-label mb-1 text-body-2">Vai trò</label>
                        </div>
                        <AppSelect v-model="dept.role" :items="departmentRoleOptions" :readonly="isIssued" />
                      </VCol>
                    </VRow>
                  </VCard>
                </VCol>

                <!-- Người thực hiện -->
                <VCol cols="12">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <span class="text-body-2 font-weight-medium">Người thực hiện</span>
                    <VBtn
                      v-if="!isIssued"
                      size="small"
                      variant="tonal"
                      prepend-icon="tabler-plus"
                      @click="addUserAssignment"
                    >
                      Thêm
                    </VBtn>
                  </div>

                  <div
                    v-if="itemForm.user_assignments.length === 0"
                    class="text-body-2 text-disabled text-center py-4 border rounded"
                  >
                    Chưa có người thực hiện nào
                  </div>

                  <VCard
                    v-for="(assignment, index) in itemForm.user_assignments"
                    :key="index"
                    variant="outlined"
                    class="mb-3 pa-3"
                  >
                    <div class="d-flex align-center justify-space-between mb-2">
                      <span class="text-caption text-medium-emphasis">Người thực hiện {{ index + 1 }}</span>
                      <VBtn
                        v-if="!isIssued"
                        icon
                        size="x-small"
                        variant="text"
                        color="error"
                        @click="removeUserAssignment(index)"
                      >
                        <VIcon icon="tabler-trash" size="14" />
                      </VBtn>
                    </div>
                    <VRow dense>
                      <VCol cols="12">
                        <div class="app-text-field">
                          <label class="v-label mb-1 text-body-2">Người dùng</label>
                        </div>
                        <VAutocomplete
                          v-model="assignment.user_id"
                          placeholder="Chọn người dùng..."
                          :items="userOptions"
                          :loading="userLoading"
                          item-title="title"
                          item-value="value"
                          clearable
                          :readonly="isIssued"
                        />
                      </VCol>
                      <VCol cols="12">
                        <div class="app-text-field">
                          <label class="v-label mb-1 text-body-2">Phòng ban</label>
                        </div>
                        <VAutocomplete
                          v-model="assignment.department_id"
                          placeholder="Chọn phòng ban..."
                          :items="departmentOptions"
                          :loading="departmentLoading"
                          item-title="title"
                          item-value="value"
                          clearable
                          :readonly="isIssued"
                        />
                      </VCol>
                      <VCol cols="12">
                        <AppSelect
                          v-model="assignment.assignment_role"
                          label="Vai trò"
                          :items="assignmentRoleOptions"
                          :readonly="isIssued"
                        />
                      </VCol>
                      <VCol cols="12">
                        <AppSelect
                          v-model="assignment.assignment_status"
                          label="Trạng thái giao việc"
                          :items="assignmentStatusOptions"
                          :readonly="isIssued"
                        />
                      </VCol>
                      <VCol cols="12">
                        <AppTextField
                          v-model="assignment.note"
                          label="Ghi chú"
                          placeholder="Ghi chú khi giao việc..."
                          :readonly="isIssued"
                        />
                      </VCol>
                    </VRow>
                  </VCard>
                </VCol>

                <!-- Actions -->
                <VCol v-if="!isIssued" cols="12">
                  <VBtn class="me-3" :loading="isItemSubmitting" @click="onItemSubmit">
                    {{ isEditItemMode ? 'Cập nhật' : 'Thêm mới' }}
                  </VBtn>
                  <VBtn variant="tonal" color="secondary" @click="itemDrawerOpen = false">Hủy</VBtn>
                </VCol>
                <VCol v-else cols="12">
                  <VBtn variant="tonal" color="secondary" @click="itemDrawerOpen = false">Đóng</VBtn>
                </VCol>
              </VRow>
            </VForm>
          </VCardText>
        </PerfectScrollbar>
      </div>
    </VNavigationDrawer>

    <!-- ── Confirm Dialog ─────────────────────────────────────── -->
    <AppConfirmDialog
      v-model:is-dialog-visible="confirmDialog.show"
      :title="confirmDialog.title"
      :confirmation-msg="confirmDialog.message"
      @confirm="confirmDialog.onConfirm"
    />

    <!-- ── Snackbar ───────────────────────────────────────────── -->
    <AppSnackbar v-model="snackbar.show" :message="snackbar.message" :color="snackbar.color" />
  </div>
</template>
