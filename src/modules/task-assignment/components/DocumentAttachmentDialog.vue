<!-- eslint-disable import/no-unresolved -->
<!-- eslint-disable import/extensions -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { getErrorMessage } from '@/utils/errorMessage'
import AppSnackbar from '@/components/AppSnackbar.vue'
import { documentApi } from '../services/documentApi'
import type { Document, DocumentAttachment } from '../services/documentApi'

interface Props {
  modelValue: boolean
  document: Document | null
}

interface Emit {
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

// --- Danh sách file đã lưu (từ server) ---
const existingAttachments = ref<DocumentAttachment[]>([])
const deletingAttachmentId = ref<number | null>(null)

// --- Danh sách file mới chọn (chưa upload) ---
const pendingFiles = ref<File[]>([])
const isUploading = ref(false)
const fileInputRef = ref<HTMLInputElement>()

const close = () => emit('update:modelValue', false)

const loadAttachments = async () => {
  if (!props.document)
    return
  try {
    const res = await documentApi.show(props.document.id)
    if (res.data.success)
      existingAttachments.value = res.data.data?.attachments ?? []
  }
  catch {
    existingAttachments.value = []
  }
}

// Chọn file qua input ẩn
const openFilePicker = () => fileInputRef.value?.click()

const onFileSelected = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files)
    return
  for (const file of Array.from(input.files))
    pendingFiles.value.push(file)

  // Reset input để có thể chọn lại cùng file
  input.value = ''
}

const removePending = (index: number) => {
  pendingFiles.value.splice(index, 1)
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const getFileIcon = (mimeType?: string, fileName?: string) => {
  const name = (fileName ?? '').toLowerCase()
  const mime = (mimeType ?? '').toLowerCase()

  if (mime.startsWith('image/'))
    return 'tabler-photo'
  if (mime.includes('pdf') || name.endsWith('.pdf'))
    return 'tabler-file-type-pdf'
  if (mime.includes('word') || name.endsWith('.doc') || name.endsWith('.docx'))
    return 'tabler-file-type-doc'
  if (mime.includes('excel') || mime.includes('spreadsheet') || name.endsWith('.xls') || name.endsWith('.xlsx'))
    return 'tabler-file-type-xls'
  if (mime.includes('zip') || mime.includes('rar') || name.endsWith('.zip') || name.endsWith('.rar'))
    return 'tabler-file-zip'

  return 'tabler-file'
}

// Upload file mới
const handleUpload = async () => {
  if (!props.document || !pendingFiles.value.length)
    return

  isUploading.value = true
  try {
    await documentApi.addAttachments(props.document.id, pendingFiles.value)
    pendingFiles.value = []
    await loadAttachments()
    showToast('Tải file lên thành công!', 'success')
    emit('updated')
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Tải file thất bại!'), 'error')
  }
  finally {
    isUploading.value = false
  }
}

// Xóa file đã lưu
const handleRemoveExisting = async (attachment: DocumentAttachment) => {
  if (!props.document)
    return

  deletingAttachmentId.value = attachment.id
  try {
    await documentApi.removeAttachment(props.document.id, attachment.id)
    existingAttachments.value = existingAttachments.value.filter(a => a.id !== attachment.id)
    showToast('Xóa file thành công!', 'success')
    emit('updated')
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Xóa file thất bại!'), 'error')
  }
  finally {
    deletingAttachmentId.value = null
  }
}

watch(() => props.modelValue, val => {
  if (val) {
    pendingFiles.value = []
    loadAttachments()
  }
})
</script>
<!-- copy from /var/www/html/code/quandh-admin/src/components/dialogs/AddEditAddressDialog.vue-->

<template>
  <VDialog
    :model-value="props.modelValue"
    scrollable
     :width="$vuetify.display.smAndDown ? 'auto' : 900 "
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <!-- 👉 Dialog close btn -->
    <DialogCloseBtn @click="emit('update:modelValue', false)" />
  
        <!-- 👉 Form -->
      <VCard v-if="props.document" class="pa-sm-10 pa-2">
      <VCardText> 
        <h4 class="text-h4 text-center mb-2">
          Tệp đính kèm
        </h4>
        <p class="text-body-1 text-center mb-6">
           {{ props.document.name }}
        </p>

      <VCardText style="min-block-size: 260px; max-block-size: 60vh;">
        <!-- Input file ẩn -->
        <input
          ref="fileInputRef"
          type="file"
          multiple
          style="display: none;"
          @change="onFileSelected"
        >

        <!-- File đã lưu trên server -->
        <div
          v-if="existingAttachments.length > 0"
          class="mb-4"
        >
          <div class="text-caption text-medium-emphasis mb-2 text-uppercase font-weight-medium">
            Đã đính kèm
          </div>

          <VList
          >
            <VListItem
              v-for="att in existingAttachments"
              :key="att.id"
            >
              <template #prepend>
                <VIcon
                  :icon="getFileIcon(att.mime_type, att.file_name)"
                  size="20"
                  color="primary"
                  class="me-2"
                />
              </template>

              <VListItemTitle>
                <a
                  v-if="att.url"
                  :href="att.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-decoration-none"
                >{{ att.file_name }}</a>
                <span v-else>{{ att.file_name }}</span>
              </VListItemTitle>

              <VListItemSubtitle
                v-if="att.size"
                class="text-caption"
              >
                {{ formatFileSize(att.size) }}
              </VListItemSubtitle>

              <template #append>
                <IconBtn
                  size="small"
                  color="error"
                  :loading="deletingAttachmentId === att.id"
                  @click="handleRemoveExisting(att)"
                >
                  <VIcon
                    icon="tabler-trash"
                  />
                  <VTooltip
                    activator="parent"
                    location="top"
                  >
                    Xóa
                  </VTooltip>
                </IconBtn>
              </template>
            </VListItem>
          </VList>
        </div>

        <div
          v-else-if="!pendingFiles.length"
          class="text-center py-6 text-disabled"
        >
          <VIcon
            icon="tabler-paperclip"
            size="40"
            class="mb-2 d-block mx-auto"
          />
          <div class="text-body-2">
            Chưa có tệp đính kèm nào
          </div>
        </div>

        <!-- File mới chọn (chưa upload) -->
        <div v-if="pendingFiles.length > 0">
          <div class="text-caption text-medium-emphasis mb-2 text-uppercase font-weight-medium">
            Chờ tải lên ({{ pendingFiles.length }})
          </div>

          <VList
          >
            <VListItem
              v-for="(file, idx) in pendingFiles"
              :key="idx"
            >
              <template #prepend>
                <VIcon
                  :icon="getFileIcon(file.type, file.name)"
                  size="20"
                  color="secondary"
                  class="me-2"
                />
              </template>

              <VListItemTitle>
                {{ file.name }}
              </VListItemTitle>

              <VListItemSubtitle class="text-caption">
                {{ formatFileSize(file.size) }}
              </VListItemSubtitle>

              <template #append>
                <IconBtn
                  size="small"
                  color="error"
                  @click="removePending(idx)"
                >
                  <VIcon
                    icon="tabler-x"
                  />
                  <VTooltip
                    activator="parent"
                    location="top"
                  >
                    Bỏ chọn
                  </VTooltip>
                </IconBtn>
              </template>
            </VListItem>
          </VList>
        </div>
      </VCardText>

      <!-- Footer actions -->
      <VCardActions class="px-6 py-4 gap-3">
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-plus"
          @click="openFilePicker"
        >
          Thêm file
        </VBtn>

        <VSpacer />

        <VBtn
          variant="tonal"
          color="secondary"
          @click="close"
        >
          Đóng
        </VBtn>

        <VBtn
          variant="tonal"
          :loading="isUploading"
          prepend-icon="tabler-upload"
          @click="handleUpload"
        >
          Tải lên ({{ pendingFiles.length }})
        </VBtn>
      </VCardActions>
      </VCardText> 
    </VCard>
  </VDialog>

  <AppSnackbar
    v-model="snackbar.show"
    :message="snackbar.message"
    :color="snackbar.color"
  />
</template>
