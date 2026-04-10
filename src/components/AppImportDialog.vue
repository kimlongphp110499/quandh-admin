<script setup lang="ts">
import { ref, watch } from 'vue'

export interface ImportError {
  row: number
  errors: string[]
}

interface Props {
  modelValue: boolean
  title?: string
  /** Mô tả ngắn hiển thị bên dưới tiêu đề */
  description?: string
  /** Danh sách định dạng file chấp nhận, hiển thị trong hint */
  acceptFormats?: string
  /** Thông tin các cột chuẩn hiển thị trong hint */
  columnHint?: string
  /** Có nút "Tải file mẫu" không */
  hasTemplate?: boolean
  /** Đang tải file mẫu */
  downloadingTemplate?: boolean
  /** Đang import */
  loading?: boolean

  /** Danh sách lỗi validate từng dòng trả về sau import */
  importErrors?: ImportError[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'import', file: File): void
  (e: 'download-template'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Nhập dữ liệu',
  description: 'Hỗ trợ tệp Excel hoặc CSV. Bạn có thể tải file mẫu trước khi nhập.',
  acceptFormats: '.xlsx,.xls,.csv',
  columnHint: '',
  hasTemplate: true,
  downloadingTemplate: false,
  loading: false,
  importErrors: () => [],
})

const emit = defineEmits<Emits>()

const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement>()
const isDragging = ref(false)
const displayFileName = ref('')

const reset = () => {
  selectedFile.value = null
  displayFileName.value = ''
}

// Reset file khi dialog đóng từ bên ngoài (vd: sau import thành công)
watch(() => props.modelValue, val => {
  if (!val)
    reset()
})

const onClose = () => {
  if (props.loading)
    return
  reset()
  emit('update:modelValue', false)
}

const triggerFileInput = () => fileInputRef.value?.click()

const handleFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return
  selectedFile.value = file
  displayFileName.value = file.name
  if (fileInputRef.value)
    fileInputRef.value.value = ''
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file)
    return
  selectedFile.value = file
  displayFileName.value = file.name
}

const handleImport = () => {
  if (!selectedFile.value)
    return
  emit('import', selectedFile.value)
}

const handleDownloadTemplate = () => {
  emit('download-template')
}
</script>

<template>
  <VDialog
    :model-value="props.modelValue"
    max-width="500"
    persistent
    @update:model-value="val => !props.loading && emit('update:modelValue', val)"
  >
    <VCard rounded="lg">
      <!-- Header -->
      <VCardTitle class="d-flex align-center justify-space-between pa-6 pb-4">
        <span class="text-h5">{{ props.title }}</span>
        <IconBtn
          :disabled="props.loading"
          @click="onClose"
        >
          <VIcon icon="tabler-x" />
        </IconBtn>
      </VCardTitle>

      <VCardText class="px-6 pb-2 mb-4">
        <div class="text-body-1 font-weight-medium mb-1">
          Tải tệp dữ liệu
        </div>
        <!-- Mô tả -->
        <p
          v-if="props.description"
          class="text-body-2 mb-5"
        >
          {{ props.description }}
        </p>

        <!-- Drop zone / file picker -->
        <div
          class="import-dropzone rounded-lg pa-4 mb-5 d-flex align-center gap-3 cursor-pointer"
          :class="{ 'import-dropzone--active': isDragging }"
          @click="triggerFileInput"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <div class="flex-grow-1">
            <div class="text-body-2 text-medium-emphasis">
              {{ displayFileName || 'Tệp dữ liệu' }}
            </div>
          </div>
          <VBtn
            color="secondary"
            variant="tonal"
            size="small"
            @click.stop="triggerFileInput"
          >
            Chọn Tệp
          </VBtn>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          :accept="props.acceptFormats"
          class="d-none"
          @change="handleFileChange"
        >

        <!-- Hint cột -->
        <VAlert
          color="success"
          variant="tonal"
          density="compact"
          :prepend-icon="props.columnHint ? 'tabler-info-circle' : undefined"
          class="text-body-2"
        >
          <template v-if="props.columnHint">
            {{ props.columnHint }}
          </template>
          <template v-else>
            Hỗ trợ tệp <code>{{ props.acceptFormats.split(',').join('</code>, <code>') }}</code>.
            Bạn có thể tải file mẫu trước khi nhập.
          </template>
        </VAlert>

        <!-- Danh sách lỗi validate từng dòng -->
        <VAlert
          v-if="props.importErrors && props.importErrors.length > 0"
          color="error"
          variant="tonal"
          density="compact"
          prepend-icon="tabler-alert-triangle"
          class="text-body-2 mt-4"
        >
          <div class="font-weight-medium mb-2">
            Một số dòng không thể import:
          </div>
          <ul class="import-error-list">
            <li
              v-for="err in props.importErrors"
              :key="err.row"
            >
              <span class="font-weight-medium">Dòng {{ err.row }}:</span>
              {{ err.errors.join(', ') }}
            </li>
          </ul>
        </VAlert>
      </VCardText>

      <!-- Actions -->
      <VCardText class="import-actions px-6 pt-4 pb-6">
        <!-- Tải file mẫu -->
        <VBtn
          v-if="props.hasTemplate"
          variant="tonal"
          color="secondary"
          :icon="$vuetify.display.xs"
          :rounded="$vuetify.display.xs ? 'lg' : undefined"
          :prepend-icon="$vuetify.display.xs ? undefined : 'tabler-download'"
          :loading="props.downloadingTemplate"
          @click="handleDownloadTemplate"
        >
          <VIcon
            v-if="$vuetify.display.xs"
            icon="tabler-download"
          />
          <template v-else>
            Tải File Mẫu
          </template>
        </VBtn>
        <div v-else />

        <div class="d-flex gap-3">
          <VBtn
            variant="tonal"
            color="secondary"
            :disabled="props.loading"
            @click="onClose"
          >
            Đóng
          </VBtn>
          <VBtn
            color="primary"
            :loading="props.loading"
            :disabled="!selectedFile"
            @click="handleImport"
          >
            Nhập Dữ Liệu
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.import-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.import-dropzone {
  border: 1.5px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  transition: border-color 0.2s, background 0.2s;
}

.import-dropzone:hover,
.import-dropzone--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.import-error-list {
  padding-inline-start: 16px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
