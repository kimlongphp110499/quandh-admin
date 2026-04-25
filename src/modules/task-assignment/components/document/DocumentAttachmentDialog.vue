<!-- eslint-disable import/no-unresolved -->
<!-- eslint-disable import/extensions -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { documentApi } from '../../services/documentApi'
import type { Document } from '../../services/documentApi'
import FileAttachmentPanel, { type AttachmentItem } from '../shared/FileAttachmentPanel.vue'
import AppSnackbar from '@/components/AppSnackbar.vue'
import { getErrorMessage } from '@/utils/errorMessage'

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

const existingAttachments = ref<AttachmentItem[]>([])
const deletingAttachmentId = ref<number | null>(null)
const pendingFiles = ref<File[]>([])
const isUploading = ref(false)

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

const handleAddFiles = (files: File[]) => {
  pendingFiles.value.push(...files)
}

const handleRemovePending = (index: number) => {
  pendingFiles.value.splice(index, 1)
}

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

const handleRemoveExisting = async (att: AttachmentItem) => {
  if (!props.document)
    return
  deletingAttachmentId.value = att.id
  try {
    await documentApi.removeAttachment(props.document.id, att.id)
    existingAttachments.value = existingAttachments.value.filter(a => a.id !== att.id)
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

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 900"
    :model-value="props.modelValue"
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <DialogCloseBtn @click="emit('update:modelValue', false)" />

    <VCard
      v-if="props.document"
      class="pa-sm-10 pa-2"
    >
      <VCardText>
        <h4 class="text-h4 text-center mb-2">
          Tệp đính kèm
        </h4>
        <p class="text-body-1 text-center mb-6">
          {{ props.document.name }}
        </p>

        <FileAttachmentPanel
          :existing-attachments="existingAttachments"
          :pending-files="pendingFiles"
          :deleting-id="deletingAttachmentId"
          delete-mode="direct"
          @add-files="handleAddFiles"
          @remove-pending="handleRemovePending"
          @remove-existing="handleRemoveExisting"
        >
          <template #actions="{ openFilePicker }">
            <VRow class="mt-4">
              <VCol cols="12">
                <VBtn
                  variant="tonal"
                  color="secondary"
                  prepend-icon="tabler-plus"
                  class="me-3"
                  @click="openFilePicker"
                >
                  Thêm file
                </VBtn>

                <VBtn
                  v-if="pendingFiles.length > 0"
                  :loading="isUploading"
                  prepend-icon="tabler-upload"
                  class="me-3"
                  @click="handleUpload"
                >
                  Tải lên ({{ pendingFiles.length }})
                </VBtn>

                <VBtn
                  variant="tonal"
                  color="secondary"
                  @click="close"
                >
                  Đóng
                </VBtn>
              </VCol>
            </VRow>
          </template>
        </FileAttachmentPanel>
      </VCardText>
    </VCard>
  </VDialog>

  <AppSnackbar
    v-model="snackbar.show"
    :message="snackbar.message"
    :color="snackbar.color"
  />
</template>
