<script setup lang="ts">
import dayjs from 'dayjs'
import { ref, watch } from 'vue'
import type { MyTaskItem, MyTaskReport } from '../services/myTaskItem'
import { useMyTaskAssignmentItemStore } from '../stores/useMyTaskAssignmentItemStore'
import { normalizeDate } from '@/utils/formatters'
import { getErrorMessage } from '@/utils/errorMessage'

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

const reportList = ref<MyTaskReport[]>([])
const reportLoading = ref(false)
const reportSubmitting = ref(false)
const editingReport = ref<MyTaskReport | null>(null)
const reportTab = ref('form')
const reportFileInput = ref<HTMLInputElement>()

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
    reportList.value = await store.getReports(itemId)
  }
  finally {
    reportLoading.value = false
  }
}

watch(() => props.modelValue, async (val) => {
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

const startEditReport = (report: MyTaskReport) => {
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

const onFilesChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files)
    reportForm.value.files = [...reportForm.value.files, ...Array.from(input.files)]
  input.value = ''
}

const removeSelectedFile = (index: number) => {
  reportForm.value.files.splice(index, 1)
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
<!-- copy from /var/www/html/code/quandh-admin/src/components/dialogs/AddEditAddressDialog.vue-->
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
                  placeholder="VD: 123/BC-..."
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
                <div class="text-body-2 mb-2">
                  Tệp đính kèm
                </div>
                <VBtn
                  variant="tonal"
                  color="secondary"
                  prepend-icon="tabler-paperclip"
                  size="small"
                  @click="reportFileInput?.click()"
                >
                  Chọn tệp
                </VBtn>
                <input
                  ref="reportFileInput"
                  type="file"
                  multiple
                  class="d-none"
                  @change="onFilesChange"
                >

                <!-- Tệp hiện có khi chỉnh sửa -->
                <div
                  v-if="editingReport?.attachments?.length"
                  class="mt-2"
                >
                  <div class="text-body-2 mb-2">
                    Tệp hiện có:
                  </div>
                  <div class="d-flex flex-wrap gap-1">
                    <VChip
                      v-for="att in editingReport.attachments"
                      :key="att.id"
                      size="small"
                      prepend-icon="tabler-paperclip"
                      :class="reportForm.removeAttachmentIds.includes(att.id) ? 'text-decoration-line-through opacity-50' : ''"
                      closable
                      @click:close="reportForm.removeAttachmentIds.push(att.id)"
                    >
                      <a
                        :href="att.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-decoration-none text-high-emphasis"
                      >{{ att.file_name }}</a>
                    </VChip>
                  </div>
                </div>

                <!-- Tệp mới chọn -->
                <div
                  v-if="reportForm.files.length"
                  class="text-body-2 mb-2"
                >
                  <VChip
                    v-for="(f, i) in reportForm.files"
                    :key="i"
                    size="small"
                    color="primary"
                    variant="tonal"
                    closable
                    @click:close="removeSelectedFile(i)"
                  >
                    {{ f.name }}
                  </VChip>
                </div>
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
            <div
              v-if="reportLoading"
              class="report-history-skeleton"
            >
              <VSkeletonLoader type="article, actions" />
              <VSkeletonLoader
                type="article, actions"
                class="mt-4"
              />
            </div>

            <div
              v-else-if="!reportList.length"
              class="report-empty-state d-flex flex-column align-center justify-center text-center"
            >
              <VAvatar
                size="72"
                variant="tonal"
                color="secondary"
                class="mb-4"
              >
                <VIcon
                  icon="tabler-file-off"
                  size="34"
                />
              </VAvatar>

              <div class="text-h6 font-weight-medium mb-2">
                Chưa có báo cáo nào
              </div>

              <div class="text-body-1 text-medium-emphasis mb-4">
                Hãy tạo báo cáo đầu tiên cho công việc này để theo dõi tiến độ xử lý.
              </div>

              <VBtn
                color="primary"
                prepend-icon="tabler-plus"
                @click="reportTab = 'form'"
              >
                Nộp báo cáo đầu tiên
              </VBtn>
            </div>

            <div
              v-else
              class="report-history-list"
            >
              <VRow class="report-history-row">
                <VCol
                  v-for="(report, index) in reportList"
                  :key="report.id"
                  cols="12"
                >
                  <VCard class="report-history-card">
                    <VCardText class="pa-5">
                      <div class="d-flex align-start justify-space-between flex-wrap gap-4 mb-4">
                        <div class="d-flex align-start gap-3 flex-grow-1 min-w-0">

                          <div class="flex-grow-1 min-w-0">
                            <div class="d-flex align-center flex-wrap gap-2 mb-2">
                              <div class="text-body-1 font-weight-bold text-high-emphasis">
                                Báo cáo #{{ reportList.length - index }}
                              </div>
                            </div>

                            <div class="d-flex flex-wrap gap-x-4 gap-y-2 text-body-2 text-medium-emphasis">
                              <!-- <div class="d-flex align-center gap-1">
                                <VIcon
                                  icon="tabler-calendar-check"
                                  size="16"
                                />
                                <span>
                                  Ngày hoàn thành:
                                  {{ dayjs(report.completed_at, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY') }}
                                </span>
                              </div> -->

                             <!-- <div class="d-flex align-center gap-1">
                                <VIcon
                                  icon="tabler-clock-edit"
                                  size="16"
                                />
                                <span>
                                  Cập nhật:
                                  {{ dayjs(report.updated_at, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY') }}
                                </span>
                              </div> -->
                            </div>
                          </div>
                        </div>

                        <VTooltip text="Chỉnh sửa báo cáo">
                          <template #activator="{ props: tooltipProps }">
                            <VBtn
                              v-bind="tooltipProps"
                              icon
                              variant="tonal"
                              @click="startEditReport(report)"
                            >
                              <VIcon icon="tabler-edit" />
                            </VBtn>
                          </template>
                        </VTooltip>
                      </div>

                      <VDivider class="mb-4" />

                       <div
                        v-if="report.report_document_number"
                        class="report-section mb-4"
                      >
                        <div class="report-section-label">
                          Ngày hoàn thành
                        </div>
                        <div class="report-section-content text-body-1 text-high-emphasis">
                           {{ dayjs(report.completed_at, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY') }}
                        </div>
                      </div>
                      <div
                        v-if="report.report_document_number"
                        class="report-section mb-4"
                      >
                        <div class="report-section-label">
                          Số hiệu
                        </div>
                        <div class="report-section-content text-body-1 text-high-emphasis">
                          {{ report.report_document_number }}
                        </div>
                      </div>

                      <div
                        v-if="report.report_document_excerpt"
                        class="report-section mb-4"
                      >
                        <div class="report-section-label">
                          Trích yếu
                        </div>
                        <div class="report-section-content text-body-1 text-high-emphasis">
                          {{ report.report_document_excerpt }}
                        </div>
                      </div>

                      <div
                        v-if="report.report_document_content"
                        class="report-section mb-4"
                      >
                        <div class="report-section-label">
                          Nội dung báo cáo
                        </div>
                        <div class="report-section-content report-content text-body-1 text-medium-emphasis">
                          {{ report.report_document_content }}
                        </div>
                      </div>

                      <div
                        v-if="report.attachments?.length"
                        class="report-section"
                      >
                        <div class="report-section-label mb-2">
                          Tệp đính kèm
                        </div>

                        <div class="d-flex flex-wrap gap-2">
                          <VChip
                            v-for="att in report.attachments"
                            :key="att.id"
                            size="small"
                            color="secondary"
                            variant="tonal"
                            class="report-attachment-chip"
                          >
                            <template #prepend>
                              <VIcon
                                icon="tabler-paperclip"
                                size="16"
                              />
                            </template>

                            <a
                              :href="att.url"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="report-attachment-link"
                            >
                              {{ att.file_name }}
                            </a>
                          </VChip>
                        </div>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </div>
          </VTabsWindowItem>
        </VTabsWindow>
      </VCardText>
    </VCard>
  </VDialog>
</template>

