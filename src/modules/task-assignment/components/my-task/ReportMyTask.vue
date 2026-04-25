<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MyTaskItem, MyTaskReport } from '../../services/myTaskItem'
import ItemReportHistoryList from '../item/ItemReportHistoryList.vue'
import FileAttachmentPanel from '../shared/FileAttachmentPanel.vue'
import { useMyTaskAssignmentItemStore } from '../../stores/useMyTaskAssignmentItemStore'
import { normalizeDate } from '@/utils/formatters'
import { getErrorMessage } from '@/utils/errorMessage'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useAuthStore } from '@/store/modules/auth'

interface Props {
  modelValue: boolean
  item: MyTaskItem | null
}

interface Emits {
  (e: 'update:modelValue', val: boolean): void
  (e: 'toast', message: string, color: 'success' | 'error'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const store = useMyTaskAssignmentItemStore()
const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id as number | undefined)

const reportList = ref<MyTaskReport[]>([])
const reportLoading = ref(false)
const reportSubmitting = ref(false)
const editingReport = ref<MyTaskReport | null>(null)
const reportTab = ref('form')

const reportForm = ref({
  completed_at: '',
  report_document_number: '',
  report_document_excerpt: '',
  report_document_content: '',
  files: [] as File[],
  removeAttachmentIds: [] as number[],
})

const resetForm = () => {
  reportForm.value = {
    completed_at: '',
    report_document_number: '',
    report_document_excerpt: '',
    report_document_content: '',
    files: [],
    removeAttachmentIds: [],
  }
  editingReport.value = null
}

const cancel = () => {
  resetForm()
  emit('update:modelValue', false)
}

const refreshReports = async (itemId: number) => {
  reportLoading.value = true
  try {
    reportList.value = await store.getReports(itemId, { only_mine: true })
  }
  finally {
    reportLoading.value = false
  }
}

watch(() => props.modelValue, async val => {
  if (val && props.item) {
    resetForm()
    reportTab.value = 'form'
    await refreshReports(props.item.id)
  }
})

const close = () => {
  emit('update:modelValue', false)
  resetForm()
}

const startEditReport = (report: MyTaskReport | any) => {
  editingReport.value = report
  reportForm.value = {
    completed_at: report.completed_at || '',
    report_document_number: report.report_document_number || '',
    report_document_excerpt: report.report_document_excerpt || '',
    report_document_content: report.report_document_content || '',
    files: [],
    removeAttachmentIds: [],
  }
  reportTab.value = 'form'
}

const submitReport = async () => {
  if (!props.item)
    return
  reportSubmitting.value = true
  try {
    const data = {
      completed_at: normalizeDate(reportForm.value.completed_at) || undefined,
      report_document_number: reportForm.value.report_document_number || undefined,
      report_document_excerpt: reportForm.value.report_document_excerpt || undefined,
      report_document_content: reportForm.value.report_document_content || undefined,
      files: reportForm.value.files.length ? reportForm.value.files : undefined,
      remove_attachment_ids: reportForm.value.removeAttachmentIds.length
        ? reportForm.value.removeAttachmentIds
        : undefined,
    }

    if (editingReport.value) {
      await store.updateReport(editingReport.value.id, data)
      emit('toast', 'Cập nhật báo cáo thành công!', 'success')
    }
    else {
      await store.createReport(props.item.id, data)
      emit('toast', 'Nộp báo cáo thành công!', 'success')
    }

    resetForm()
    reportTab.value = 'history'
    await refreshReports(props.item.id)
  }
  catch (err: any) {
    emit('toast', getErrorMessage(err, 'Thao tác thất bại!'), 'error')
  }
  finally {
    reportSubmitting.value = false
  }
}
</script>

<!-- copy from /var/www/html/code/quandh-admin/src/components/dialogs/AddEditAddressDialog.vue -->
<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 900"
    :model-value="props.modelValue"
    scrollable
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <DialogCloseBtn @click="close" />

    <VCard class="pa-sm-10 pa-2">
      <VCardText>
        <h4 class="text-h4 text-center mb-2">
          Báo cáo thực hiện công việc
        </h4>
        <p
          v-if="props.item"
          class="text-body-1 text-center text-medium-emphasis mb-6"
        >
          {{ props.item.name }}
        </p>

        <VTabs
          v-model="reportTab"
          class="mb-6"
        >
          <VTab value="form">
            {{ editingReport ? 'Chỉnh sửa báo cáo' : 'Nộp báo cáo mới' }}
          </VTab>
          <VTab value="history">
            Lịch sử báo cáo
          </VTab>
        </VTabs>

        <VTabsWindow v-model="reportTab">
          <!-- Form Tab -->
          <VTabsWindowItem value="form">
            <VRow>
              <VCol
                cols="12"
                sm="6"
              >
                <AppDateTimePicker
                  v-model="reportForm.completed_at"
                  :config="{ dateFormat: 'd/m/Y' }"
                  label="Ngày hoàn thành"
                  clearable
                  hide-details
                />
              </VCol>

              <VCol
                cols="12"
                sm="6"
              >
                <AppTextField
                  v-model="reportForm.report_document_number"
                  label="Số hiệu"
                  hide-details
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="reportForm.report_document_excerpt"
                  label="Trích yếu"
                  placeholder=""
                  hide-details
                />
              </VCol>

              <VCol cols="12">
                <AppTextarea
                  v-model="reportForm.report_document_content"
                  label="Nội dung báo cáo"
                  placeholder="Nhập nội dung chi tiết báo cáo thực hiện công việc..."
                  rows="5"
                  hide-details
                />
              </VCol>

              <!-- File Attachments -->
              <VCol cols="12">
                <FileAttachmentPanel
                  :existing-attachments="editingReport?.attachments ?? []"
                  :pending-files="reportForm.files"
                  :remove-attachment-ids="reportForm.removeAttachmentIds"
                  delete-mode="mark"
                  @add-files="files => reportForm.files.push(...files)"
                  @remove-pending="i => reportForm.files.splice(i, 1)"
                  @mark-remove="id => reportForm.removeAttachmentIds.push(id)"
                >
                  <template #actions="{ openFilePicker }">
                    <VBtn
                      variant="tonal"
                      color="secondary"
                      prepend-icon="tabler-plus"
                      class="mt-2"
                      @click="openFilePicker"
                    >
                      Thêm file
                    </VBtn>
                  </template>
                </FileAttachmentPanel>
              </VCol>
            </VRow>

            <VCol
              cols="12"
              class="text-center mt-3"
            >
              <VBtn
                color="primary"
                class="me-3"
                :loading="reportSubmitting"
                @click="submitReport"
              >
                {{ editingReport ? 'Cập nhật' : 'Nộp' }}
              </VBtn>
              <VBtn
                variant="tonal"
                color="secondary"
                :disabled="reportSubmitting"
                @click="cancel"
              >
                Hủy
              </VBtn>
            </VCol>
          </VTabsWindowItem>

          <!-- History Tab -->
          <VTabsWindowItem value="history">
            <ItemReportHistoryList
              :reports="reportList"
              :is-loading="reportLoading"
              :current-user-id="currentUserId"
              @edit="startEditReport"
            />
          </VTabsWindowItem>
        </VTabsWindow>
      </VCardText>
    </VCard>
  </VDialog>
</template>
