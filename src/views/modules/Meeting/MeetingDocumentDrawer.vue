<script setup lang="ts">
import { computed, ref, watch } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useMeetingDocumentStore } from '@/store/modules/meetingDocument'

interface Props {
  isDrawerOpen: boolean
  meetingId: number | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:isDrawerOpen': [value: boolean] }>()

const docStore = useMeetingDocumentStore()

// Upload state
const fileInput = ref<HTMLInputElement>()
const uploadName = ref('')
const uploadType = ref('')
const isUploadDialogVisible = ref(false)
const selectedFiles = ref<File[]>([])

// Delete state
const isDeleteDialogVisible = ref(false)
const deletingDocId = ref<number | null>(null)

// Preview state
const isPreviewing = ref<number | null>(null)

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

// Computed
const documents = computed(() => docStore.documents)
const isLoading = computed(() => docStore.isLoading)
const isUploading = computed(() => docStore.isUploading)

const fileTypeIcon = (fileType: string | null) => {
  const icons: Record<string, string> = {
    pdf: 'tabler-file-type-pdf',
    doc: 'tabler-file-type-doc',
    docx: 'tabler-file-type-doc',
    xls: 'tabler-file-type-xls',
    xlsx: 'tabler-file-type-xls',
    ppt: 'tabler-file-type-ppt',
    pptx: 'tabler-file-type-ppt',
    txt: 'tabler-file-type-txt',
    png: 'tabler-file-type-png',
    jpg: 'tabler-file-type-jpg',
    jpeg: 'tabler-file-type-jpg',
  }

  return icons[fileType?.toLowerCase() ?? ''] || 'tabler-file'
}

const fileTypeColor = (fileType: string | null) => {
  const colors: Record<string, string> = {
    pdf: 'error',
    doc: 'info',
    docx: 'info',
    xls: 'success',
    xlsx: 'success',
    ppt: 'warning',
    pptx: 'warning',
    txt: 'secondary',
    png: 'primary',
    jpg: 'primary',
    jpeg: 'primary',
  }

  return colors[fileType?.toLowerCase() ?? ''] || 'secondary'
}

// Load documents when drawer opens
watch(() => props.isDrawerOpen, async open => {
  if (open && props.meetingId) {
    docStore.reset()
    try {
      await docStore.fetchDocuments(props.meetingId)
    }
    catch {
      showToast('Không thể tải danh sách tài liệu!', 'error')
    }
  }
})

// Upload
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (!files || files.length === 0)
    return
  selectedFiles.value = Array.from(files)
  uploadName.value = ''
  uploadType.value = ''
  isUploadDialogVisible.value = true

  // Reset input để có thể chọn lại cùng file
  if (fileInput.value)
    fileInput.value.value = ''
}

const handleUploadConfirm = async () => {
  if (!props.meetingId || selectedFiles.value.length === 0)
    return
  try {
    await docStore.uploadDocuments(
      props.meetingId,
      selectedFiles.value,
      uploadName.value || undefined,
      uploadType.value || undefined,
    )
    showToast(`Đã tải lên ${selectedFiles.value.length} tài liệu!`, 'success')
    isUploadDialogVisible.value = false
    selectedFiles.value = []
  }
  catch (err: any) {
    showToast(err?.response?.data?.message || 'Tải lên thất bại!', 'error')
  }
}

const cancelUpload = () => {
  isUploadDialogVisible.value = false
  selectedFiles.value = []
  uploadName.value = ''
  uploadType.value = ''
}

// Delete
const confirmDelete = (docId: number) => {
  deletingDocId.value = docId
  isDeleteDialogVisible.value = true
}

const handleDeleteConfirm = async () => {
  if (!props.meetingId || deletingDocId.value === null)
    return
  try {
    await docStore.deleteDocument(props.meetingId, deletingDocId.value)
    showToast('Đã xóa tài liệu!', 'success')
  }
  catch {
    showToast('Xóa thất bại!', 'error')
  }
  finally {
    isDeleteDialogVisible.value = false
    deletingDocId.value = null
  }
}

// Preview
const handlePreview = async (docId: number) => {
  if (!props.meetingId)
    return
  isPreviewing.value = docId
  try {
    await docStore.previewDocument(props.meetingId, docId)
  }
  catch {
    showToast('Không thể xem trước tài liệu!', 'error')
  }
  finally {
    isPreviewing.value = null
  }
}
</script>

<template>
  <VNavigationDrawer
    :model-value="isDrawerOpen"
    temporary
    location="end"
    width="520"
    @update:model-value="emit('update:isDrawerOpen', $event)"
  >
    <!-- Header -->
    <div class="d-flex align-center pa-4 border-b">
      <VIcon
        icon="tabler-files"
        class="me-3"
        color="primary"
      />
      <h6 class="text-h6">
        Tài liệu cuộc họp
      </h6>
      <VSpacer />
      <VBtn
        icon="tabler-x"
        variant="text"
        size="small"
        @click="emit('update:isDrawerOpen', false)"
      />
    </div>

    <!-- Upload area -->
    <div class="pa-4 border-b">
      <VBtn
        prepend-icon="tabler-upload"
        color="primary"
        variant="tonal"
        block
        :loading="isUploading"
        @click="triggerFileInput"
      >
        Tải lên tài liệu
      </VBtn>
      <input
        ref="fileInput"
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
        class="d-none"
        @change="handleFileChange"
      >
      <div class="text-caption text-disabled mt-2 text-center">
        Hỗ trợ: PDF, Word, Excel, PowerPoint, TXT, ảnh — tối đa 50MB/file
      </div>
    </div>

    <!-- Document list -->
    <div
      class="overflow-y-auto"
      style="height: calc(100% - 145px);"
    >
      <!-- Loading -->
      <div
        v-if="isLoading"
        class="d-flex justify-center align-center pa-8"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>

      <!-- Empty -->
      <div
        v-else-if="documents.length === 0"
        class="d-flex flex-column align-center justify-center pa-10 text-center"
      >
        <VIcon
          icon="tabler-file-off"
          size="48"
          color="disabled"
          class="mb-3"
        />
        <div class="text-body-1 text-disabled">
          Chưa có tài liệu nào
        </div>
        <div class="text-caption text-disabled mt-1">
          Nhấn "Tải lên tài liệu" để thêm
        </div>
      </div>

      <!-- List -->
      <VList
        v-else
        lines="two"
      >
        <VListItem
          v-for="doc in documents"
          :key="doc.id"
          class="py-3"
        >
          <template #prepend>
            <VAvatar
              :color="fileTypeColor(doc.file_type)"
              variant="tonal"
              rounded
              size="40"
            >
              <VIcon
                :icon="fileTypeIcon(doc.file_type)"
                size="22"
              />
            </VAvatar>
          </template>

          <VListItemTitle class="font-weight-medium text-truncate mb-1">
            {{ doc.name }}
          </VListItemTitle>
          <VListItemSubtitle>
            <span
              v-if="doc.type"
              class="me-2"
            >
              <VChip
                size="x-small"
                variant="tonal"
                color="secondary"
              >{{ doc.type }}</VChip>
            </span>
            <span class="text-caption">
              {{ doc.uploaded_by }} · {{ doc.created_at }}
            </span>
          </VListItemSubtitle>

          <template #append>
            <div class="d-flex gap-1">
              <!-- Preview -->
              <VBtn
                icon
                size="small"
                variant="text"
                color="primary"
                :loading="isPreviewing === doc.id"
                @click="handlePreview(doc.id)"
              >
                <VIcon icon="tabler-eye" />
                <VTooltip
                  activator="parent"
                  location="top"
                >
                  Xem trước
                </VTooltip>
              </VBtn>

              <!-- Delete -->
              <VBtn
                icon
                size="small"
                variant="text"
                color="error"
                @click="confirmDelete(doc.id)"
              >
                <VIcon icon="tabler-trash" />
                <VTooltip
                  activator="parent"
                  location="top"
                >
                  Xóa
                </VTooltip>
              </VBtn>
            </div>
          </template>
        </VListItem>
      </VList>
    </div>

    <!-- Upload confirm dialog -->
    <VDialog
      v-model="isUploadDialogVisible"
      max-width="480"
    >
      <VCard>
        <VCardTitle class="text-h6 pa-4">
          Xác nhận tải lên
        </VCardTitle>
        <VCardText class="pt-0">
          <p class="mb-4 text-body-2">
            Đã chọn <strong>{{ selectedFiles.length }} file</strong>:
          </p>
          <ul class="mb-4 ps-4">
            <li
              v-for="f in selectedFiles"
              :key="f.name"
              class="text-body-2 text-truncate"
            >
              {{ f.name }}
            </li>
          </ul>

          <VTextField
            v-model="uploadName"
            label="Tên tài liệu (tùy chọn)"
            placeholder="Để trống sẽ dùng tên file gốc"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <VTextField
            v-model="uploadType"
            label="Loại tài liệu (tùy chọn)"
            placeholder="VD: Biên bản, Báo cáo..."
            variant="outlined"
            density="compact"
          />
        </VCardText>
        <VCardActions class="pa-4 pt-0">
          <VSpacer />
          <VBtn
            variant="tonal"
            @click="cancelUpload"
          >
            Hủy
          </VBtn>
          <VBtn
            color="primary"
            :loading="isUploading"
            @click="handleUploadConfirm"
          >
            Tải lên
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete confirm dialog -->
    <VDialog
      v-model="isDeleteDialogVisible"
      max-width="400"
    >
      <VCard>
        <VCardTitle class="text-h6 pa-4">
          Xác nhận xóa
        </VCardTitle>
        <VCardText>
          Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.
        </VCardText>
        <VCardActions class="pa-4 pt-0">
          <VSpacer />
          <VBtn
            variant="tonal"
            @click="isDeleteDialogVisible = false"
          >
            Hủy
          </VBtn>
          <VBtn
            color="error"
            :loading="isLoading"
            @click="handleDeleteConfirm"
          >
            Xóa
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
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
  </VNavigationDrawer>
</template>
