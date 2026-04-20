<script setup lang="ts">
import dayjs from 'dayjs'
import FileAttachmentPanel, { type AttachmentItem } from '../shared/FileAttachmentPanel.vue'

export interface ReportAttachment {
  id: number
  file_name: string
  url?: string
  file_url?: string
  mime_type?: string
  file_size?: number
  size?: number
}

export interface ReportItem {
  id: number
  completed_at?: string
  report_document_number?: string
  report_document_excerpt?: string
  report_document_content?: string
  attachments?: ReportAttachment[]
}

interface Props {
  reports: ReportItem[]
  isLoading?: boolean
  canEdit?: boolean
}

interface Emits {
  (e: 'edit', report: ReportItem): void
}

withDefaults(defineProps<Props>(), { canEdit: true })
defineEmits<Emits>()

const toAttachmentItems = (atts?: ReportAttachment[]): AttachmentItem[] =>
  (atts ?? []).map(a => ({
    id: a.id,
    file_name: a.file_name,
    url: a.file_url || a.url || '',
    mime_type: a.mime_type,
    size: a.file_size ?? a.size,
  }))
</script>

<template>
  <!-- Loading -->
  <div
    v-if="isLoading"
    class="report-history-skeleton"
  >
    <VSkeletonLoader type="article, actions" />
    <VSkeletonLoader
      type="article, actions"
      class="mt-4"
    />
  </div>

  <!-- Empty state -->
  <div
    v-else-if="!reports.length"
    class="d-flex flex-column align-center justify-center text-center py-8"
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
    <div class="text-body-1 text-medium-emphasis">
      Chưa có báo cáo nào được tạo cho công việc này.
    </div>
  </div>

  <!-- List -->
  <VRow v-else>
    <VCol
      v-for="(report, index) in reports"
      :key="report.id"
      cols="12"
    >
      <VCard variant="outlined">
        <VCardText class="pa-5">
          <!-- Header -->
          <div class="d-flex align-start justify-space-between flex-wrap gap-4 mb-4">
            <div class="text-body-1 font-weight-bold text-high-emphasis">
              Báo cáo #{{ reports.length - index }}
            </div>

            <VTooltip
              v-if="canEdit"
              text="Chỉnh sửa báo cáo"
            >
              <template #activator="{ props: tooltipProps }">
                <VBtn
                  v-bind="tooltipProps"
                  icon
                  variant="tonal"
                  size="small"
                  @click="$emit('edit', report)"
                >
                  <VIcon icon="tabler-edit" />
                </VBtn>
              </template>
            </VTooltip>
          </div>

          <VDivider class="mb-4" />

          <!-- Ngày hoàn thành -->
          <div
            v-if="report.completed_at"
            class="report-section mb-4"
          >
            <div class="report-section-label text-caption text-medium-emphasis font-weight-medium mb-1">
              Ngày hoàn thành
            </div>
            <div class="report-section-content text-body-1 text-high-emphasis">
              {{ dayjs(report.completed_at, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY') }}
            </div>
          </div>

          <!-- Số hiệu -->
          <div
            v-if="report.report_document_number"
            class="report-section mb-4"
          >
            <div class="report-section-label text-caption text-medium-emphasis font-weight-medium mb-1">
              Số hiệu
            </div>
            <div class="report-section-content text-body-1 text-high-emphasis">
              {{ report.report_document_number }}
            </div>
          </div>

          <!-- Trích yếu -->
          <div
            v-if="report.report_document_excerpt"
            class="report-section mb-4"
          >
            <div class="report-section-label text-caption text-medium-emphasis font-weight-medium mb-1">
              Trích yếu
            </div>
            <div class="report-section-content text-body-1 text-high-emphasis">
              {{ report.report_document_excerpt }}
            </div>
          </div>

          <!-- Nội dung -->
          <div
            v-if="report.report_document_content"
            class="report-section mb-4"
          >
            <div class="report-section-label text-caption text-medium-emphasis font-weight-medium mb-1">
              Nội dung báo cáo
            </div>
            <div
              class="report-section-content text-body-1 text-medium-emphasis"
              style="white-space: pre-wrap;"
            >
              {{ report.report_document_content }}
            </div>
          </div>

          <!-- Tệp đính kèm -->
          <div
            v-if="report.attachments?.length"
            class="report-section"
          >
            <FileAttachmentPanel
              :existing-attachments="toAttachmentItems(report.attachments)"
              readonly
            />
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
