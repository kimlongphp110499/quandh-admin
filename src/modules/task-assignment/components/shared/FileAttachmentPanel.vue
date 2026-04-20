<!-- eslint-disable import/no-unresolved -->
<!-- eslint-disable import/extensions -->
<script setup lang="ts">
export interface AttachmentItem {
  id: number
  file_name?: string
  name?: string
  mime_type?: string
  size?: number
  url?: string
}

interface Props {
  existingAttachments?: AttachmentItem[]
  pendingFiles?: File[]
  deletingId?: number | null
  readonly?: boolean
  /** 'direct': xóa ngay (emit remove-existing) | 'mark': đánh dấu xóa (emit mark-remove) */
  deleteMode?: 'direct' | 'mark'
  /** Danh sách id đã đánh dấu xóa (dùng khi deleteMode='mark') */
  removeAttachmentIds?: number[]
}

interface Emits {
  (e: 'add-files', files: File[]): void
  (e: 'remove-pending', index: number): void
  (e: 'remove-existing', attachment: AttachmentItem): void
  (e: 'mark-remove', id: number): void
}

const props = withDefaults(defineProps<Props>(), {
  existingAttachments: () => [],
  pendingFiles: () => [],
  deletingId: null,
  readonly: false,
  deleteMode: 'direct',
  removeAttachmentIds: () => [],
})

const emit = defineEmits<Emits>()

const fileInputRef = ref<HTMLInputElement>()

const openFilePicker = () => fileInputRef.value?.click()

const onFileSelected = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  emit('add-files', Array.from(input.files))
  input.value = ''
}

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

const isMarkedForRemoval = (id: number) => props.removeAttachmentIds.includes(id)

const handleRemoveExisting = (att: AttachmentItem) => {
  if (props.deleteMode === 'mark')
    emit('mark-remove', att.id)
  else
    emit('remove-existing', att)
}

defineExpose({ openFilePicker })
</script>

<template>
  <div>
    <input
      ref="fileInputRef"
      type="file"
      multiple
      style="display: none;"
      @change="onFileSelected"
    >

    <!-- Tệp đã lưu trên server -->
    <div
      v-if="props.existingAttachments.length > 0"
      class="mb-3"
    >
      <div class="text-caption text-medium-emphasis mb-2 text-uppercase font-weight-medium">
        Đã đính kèm
      </div>
      <VList>
        <VListItem
          v-for="att in props.existingAttachments"
          :key="att.id"
          :class="isMarkedForRemoval(att.id) ? 'opacity-50' : ''"
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
              :class="isMarkedForRemoval(att.id) ? 'text-decoration-line-through' : ''"
            >{{ att.file_name || att.name }}</a>
            <span v-else>{{ att.file_name || att.name }}</span>
          </VListItemTitle>

          <VListItemSubtitle
            v-if="att.size"
            class="text-caption"
          >
            {{ formatFileSize(att.size) }}
          </VListItemSubtitle>

          <template
            v-if="!props.readonly"
            #append
          >
            <IconBtn
              size="small"
              color="error"
              :loading="props.deleteMode === 'direct' && props.deletingId === att.id"
              :disabled="props.deleteMode === 'mark' && isMarkedForRemoval(att.id)"
              @click="handleRemoveExisting(att)"
            >
              <VIcon icon="tabler-trash" />
              <VTooltip activator="parent" location="top">
                Xóa
              </VTooltip>
            </IconBtn>
          </template>
        </VListItem>
      </VList>
    </div>

    <!-- Trạng thái rỗng -->
    <div
      v-else-if="!props.pendingFiles.length"
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

    <!-- Tệp mới chọn (chưa upload) -->
    <div
      v-if="props.pendingFiles.length > 0"
      class="mb-3"
    >
      <div class="text-caption text-medium-emphasis mb-2 text-uppercase font-weight-medium">
        Chờ tải lên ({{ props.pendingFiles.length }})
      </div>
      <VList>
        <VListItem
          v-for="(file, idx) in props.pendingFiles"
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

          <VListItemTitle>{{ file.name }}</VListItemTitle>

          <VListItemSubtitle class="text-caption">
            {{ formatFileSize(file.size) }}
          </VListItemSubtitle>

          <template
            v-if="!props.readonly"
            #append
          >
            <IconBtn
              size="small"
              color="error"
              @click="emit('remove-pending', idx)"
            >
              <VIcon icon="tabler-x" />
              <VTooltip activator="parent" location="top">
                Bỏ chọn
              </VTooltip>
            </IconBtn>
          </template>
        </VListItem>
      </VList>
    </div>

    <!-- Slot cho nút Thêm file / Tải lên -->
    <slot name="actions" :open-file-picker="openFilePicker" />
  </div>
</template>
