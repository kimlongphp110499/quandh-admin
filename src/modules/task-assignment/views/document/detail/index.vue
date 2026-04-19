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
import AppFilterBar from '@/components/AppFilterBar.vue'
import ItemFormDrawer from '../../../components/ItemFormDrawer.vue'
import DocumentAboutPanel from '../../../components/document/DocumentAboutPanel.vue'
import { documentApi } from '../../../services/documentApi'
import { typeApi } from '../../../services/typeApi'
import type { Document, DocumentAttachment } from '../../../services/documentApi'
import { DOCUMENT_DETAIL_TABLE_HEADERS } from '../../../configs/documentOptions'
import { useItemStore } from '../../../stores/useItemStore'
import type { Item, ItemStatus } from '../../../services/itemApi'
import { itemApi } from '../../../services/itemApi'
import DocumentActivityTimeline from '@/modules/task-assignment/components/document/DocumentActivityTimeline.vue'

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
const currentDoc = ref<Document | null>(null)
const isDocLoading = ref(false)

const fetchDocument = async () => {
  isDocLoading.value = true
  try {
    const res = await documentApi.show(documentId.value)
    if (res.data.success)
      currentDoc.value = res.data.data || null
  }
  catch {
    showToast('Không tải được thông tin văn bản.', 'error')
  }
  finally { isDocLoading.value = false }
}

const isIssued = computed(() => currentDoc.value?.status === 'issued')

// ── About Panel ───────────────────────────────────────────────────
const aboutData = computed(() => {
  const doc = currentDoc.value
  if (!doc) return { about: [], contacts: [], teams: [], overview: [] }
  return {
    about: [
      { icon: 'tabler-file-text', property: 'Tên văn bản', value: doc.name },
      { icon: 'tabler-tag', property: 'Loại văn bản', value: doc.type?.name || '—' },
      { icon: 'tabler-circle-check', property: 'Trạng thái', value: doc.status === 'issued' ? 'Ban hành' : 'Bản nháp' },
      { icon: 'tabler-calendar', property: 'Ngày ban hành', value: formatDate(doc.issue_date) },
      { icon: 'tabler-calendar-event', property: 'Thời điểm ban hành', value: formatDate(doc.issued_at) },
      { icon: 'tabler-user-check', property: 'Người ban hành', value: doc.issued_by || '—' },
      { icon: 'tabler-user', property: 'Người tạo', value: doc.created_by || '—' },
      { icon: 'tabler-clock', property: 'Ngày tạo', value: formatDate(doc.created_at) },
      { icon: 'tabler-align-left', property: 'Tóm tắt nội dung', value: doc.summary || '—' },
    ],
    contacts: [],
    teams: [],
    overview: [],
  }
})

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
    const res = await typeApi.list({ page: typePage.value, limit: 20, status: 'active' })
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
    const res = await documentApi.update(documentId.value, payload)
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
const existingAttachments = ref<DocumentAttachment[]>([])
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
    const res = await documentApi.addAttachments(documentId.value, pendingFiles.value)
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

const handleRemoveAttachment = async (att: DocumentAttachment) => {
  showConfirm('Xóa file', `Bạn có chắc muốn xóa file "${att.file_name || att.name}"?`, async () => {
    deletingAttachmentId.value = att.id
    try {
      await documentApi.removeAttachment(documentId.value, att.id)
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
const items = ref<Item[]>([])
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
    const res = await itemApi.list({
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

const confirmDeleteItem = (item: Item) => {
  if (isIssued.value)
    return

  showConfirm('Xóa công việc', `Bạn có chắc muốn xóa công việc "${item.name}"?`, async () => {
    isDeletingItem.value = item.id
    try {
      await itemApi.delete(item.id)
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
const editingItem = ref<Item | null>(null)

const openAddItemDrawer = () => {
  if (isIssued.value)
    return

  editingItem.value = {
    task_assignment_document_id: documentId.value,
    document: { status: currentDoc.value?.status || 'draft' },
  } as any
  itemDrawerOpen.value = true
}

const openEditItemDrawer = (item: Item) => {
  editingItem.value = {
    ...item,
    task_assignment_document_id: item.task_assignment_document_id || documentId.value,
    document: { status: currentDoc.value?.status || 'draft' },
  } as any
  itemDrawerOpen.value = true
}

const handleItemSubmit = async () => {
  itemDrawerOpen.value = false
  await fetchItems()
}
// ── Timeline hoạt động văn bản ────────────────────────────────────────────
const timelineItems = computed(() => {
  const doc = currentDoc.value
  if (!doc) return []

  const items = []

  // Người tạo văn bản
  if (doc.created_by) {
    items.push({
      color: 'primary',
      title: 'Tạo văn bản',
      time: formatDate(doc.created_at),
      desc: `Văn bản được tạo bởi ${doc.created_by}`,
    })
  }

  // Người cập nhật (chỉ hiện nếu khác người tạo hoặc thời gian khác)
  if (doc.updated_by && doc.updated_at !== doc.created_at) {
    items.push({
      color: 'info',
      title: 'Cập nhật văn bản',
      time: formatDate(doc.updated_at),
      desc: `Cập nhật lần cuối bởi ${doc.updated_by}`,
    })
  }

  // Người ban hành
  if (doc.status === 'issued' && doc.issued_by) {
    items.push({
      color: 'success',
      title: 'Ban hành văn bản',
      time: formatDate(doc.issued_at),
      desc: `Văn bản được ban hành bởi ${doc.issued_by}`,
    })
  }

  // Sắp xếp theo thứ tự thời gian tăng dần
  return items
})

onMounted(async () => {
  await fetchDocument()
  await fetchItems()
})
</script>

<template>
  <div>

    <!-- ── Skeleton ───────────────────────────────────────────── -->
    <template v-if="isDocLoading">
      <VSkeletonLoader type="card" class="mb-4" />
    </template>

    <template v-else-if="currentDoc">
      <VRow class="mb-5 match-height">
        <!-- Left: About -->
        <VCol cols="12" md="4">
          <DocumentAboutPanel
            :about="aboutData.about"
            :contacts="aboutData.contacts"
            :teams="aboutData.teams"
            :overview="aboutData.overview"
          />
        </VCol>
        <!-- Right: Timeline -->
        <VCol cols="12" md="8">
          <DocumentActivityTimeline :items="timelineItems" />
        </VCol>
      </VRow>

      <!-- ── Card tệp đính kèm ─────────────────────────────── -->
      <VCard class="mb-5">
        <VCardTitle class="pa-5 pb-3 d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <span>Tệp đính kèm</span>
          </div>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-5">
          <!-- Chế độ xem -->
          <template v-if="!docEditMode">
            <VRow>
              <!-- File đính kèm -->
              <VCol cols="12" md="12">


                <!-- Input ẩn -->
                <input ref="fileInputRef" type="file" multiple style="display: none;" @change="onFileSelected">

                <!-- File đã lưu -->
                <div v-if="existingAttachments.length > 0" class="mb-3">
                  <div class="text-body-1 font-weight-medium me-2">
                    Đã đính kèm
                  </div>
                  <VList>
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
                  <div class="text-body-1 font-weight-medium me-2">
                    Chờ tải lên ({{ pendingFiles.length }})
                  </div>
                  <VList>
                    <VListItem v-for="(file, idx) in pendingFiles" :key="idx" class="py-2">
                      <template #prepend>
                        <VIcon :icon="getFileIcon(file.type, file.name)" size="20" color="secondary" class="me-2" />
                      </template>
                      <VListItemTitle class="text-body-2">{{ file.name }}</VListItemTitle>
                      <VListItemSubtitle class="text-caption">{{ formatFileSize(file.size) }}</VListItemSubtitle>
                      <template #append>
                        <IconBtn color="error" @click="removePending(idx)">
                          <VIcon icon="tabler-x" />
                          <VTooltip activator="parent" location="top">Bỏ chọn</VTooltip>
                        </IconBtn>
                      </template>
                    </VListItem>
                  </VList>
                </div>

                <!-- Actions file -->
                <div v-if="!isIssued" class="d-flex gap-2 mt-2">
                  <VBtn variant="tonal" color="secondary" prepend-icon="tabler-plus" @click="openFilePicker">
                    Thêm file
                  </VBtn>
                  <VBtn
                    v-if="pendingFiles.length > 0"
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

                <!-- File khi edit -->
                <VCol cols="12" md="4">
                  <div class="text-caption text-medium-emphasis mb-3 text-uppercase font-weight-medium">
                    Tệp đính kèm
                  </div>
                  <input ref="fileInputRef" type="file" multiple style="display: none;" @change="onFileSelected">
                  <div v-if="existingAttachments.length > 0" class="mb-3">
                    <div class="text-body-1 font-weight-medium me-2">Đã đính kèm</div>
                    <VList>
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
                    <div class="text-body-1 font-weight-medium me-2">Chờ tải lên ({{ pendingFiles.length }})</div>
                    <VList>
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
      <AppFilterBar :show-filters="false">
        <template #actions>
           <!-- Add -->
          <VBtn @click="openAddItemDrawer">
            <VIcon icon="tabler-plus" />
            <span class="d-none d-sm-inline ms-1">Thêm mới</span>
          </VBtn>
        </template>

        <VDataTableServer
          :headers="DOCUMENT_DETAIL_TABLE_HEADERS"
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
              color="error"
              :disabled="isIssued"
              :loading="isDeletingItem === item.id"
              @click="!isIssued && confirmDeleteItem(item)"
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
      </AppFilterBar>
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
    <ItemFormDrawer
      v-model:is-drawer-open="itemDrawerOpen"
      :item="editingItem as any"
      @submit="handleItemSubmit"
    />

    <!-- ── Confirm Dialog ─────────────────────────────────────── -->
    <AppConfirmDialog
      v-model="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      @confirm="() => { confirmDialog.onConfirm(); confirmDialog.show = false }"
    />

    <!-- ── Snackbar ───────────────────────────────────────────── -->
    <AppSnackbar v-model="snackbar.show" :message="snackbar.message" :color="snackbar.color" />
  </div>
</template>
