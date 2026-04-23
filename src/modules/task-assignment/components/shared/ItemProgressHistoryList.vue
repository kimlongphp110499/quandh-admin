<script setup lang="ts">
import dayjs from 'dayjs'

export interface ProgressHistoryEntry {
  id: number
  user_name?: string
  old_processing_status?: string
  new_processing_status?: string
  old_completion_percent?: number
  new_completion_percent?: number
  note?: string
  created_at: string
}

interface Props {
  entries: ProgressHistoryEntry[]
  isLoading?: boolean
}

withDefaults(defineProps<Props>(), { isLoading: false })

const STATUS_LABEL: Record<string, string> = {
  todo: 'Chưa bắt đầu',
  in_progress: 'Đang thực hiện',
  done: 'Hoàn thành',
  overdue: 'Quá hạn',
  paused: 'Tạm dừng',
  cancelled: 'Đã hủy',
}

const STATUS_COLOR: Record<string, string> = {
  todo: 'default',
  in_progress: 'info',
  done: 'success',
  overdue: 'error',
  paused: 'warning',
  cancelled: 'secondary',
}

const statusColor = (s?: string) => STATUS_COLOR[s ?? ''] || 'default'
const statusLabel = (s?: string) => STATUS_LABEL[s ?? ''] || s || ''
</script>

<template>
  <!-- Loading -->
  <div v-if="isLoading">
    <VSkeletonLoader type="article" />
    <VSkeletonLoader
      type="article"
      class="mt-4"
    />
  </div>

  <!-- Empty -->
  <div
    v-else-if="!entries.length"
    class="d-flex flex-column align-center justify-center text-center py-8"
  >
    <VAvatar
      size="72"
      variant="tonal"
      color="secondary"
      class="mb-4"
    >
      <VIcon
        icon="tabler-history-off"
        size="34"
      />
    </VAvatar>
    <div class="text-h6 font-weight-medium mb-2">
      Chưa có lịch sử
    </div>
    <div class="text-body-1 text-medium-emphasis">
      Chưa có lần cập nhật tiến độ nào.
    </div>
  </div>

  <!-- List -->
  <VRow v-else>
    <VCol
      v-for="(entry, index) in entries"
      :key="entry.id"
      cols="12"
    >
      <VCard variant="outlined">
        <VCardText class="pa-5">
          <!-- Header -->
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="text-body-1 font-weight-bold text-high-emphasis">
              Lần cập nhật #{{ entries.length - index }}
            </div>
          </div>

          <VDivider class="mb-4" />

          <!-- Thời gian cập nhật -->
          <div
            v-if="entry.created_at"
            class="report-section mb-4"
          >
            <div class="report-section-content text-body-1 text-high-emphasis mb-1">
              Thời gian cập nhật
            </div>
            <div class="report-section-label text-caption text-medium-emphasis font-weight-medium">
              {{ dayjs(entry.created_at, 'HH:mm:ss DD/MM/YYYY').format('HH:mm DD/MM/YYYY') }}
            </div>
          </div>

          <!-- Trạng thái -->
          <div
            v-if="entry.old_processing_status || entry.new_processing_status"
            class="report-section mb-4"
          >
            <div class="report-section-content text-body-1 text-high-emphasis mb-1">
              Trạng thái
            </div>
            <div class="d-flex align-center flex-wrap gap-2 report-section-label">
              <VChip
                v-if="entry.old_processing_status"
                :color="statusColor(entry.old_processing_status)"
                size="x-small"
                label
              >
                {{ statusLabel(entry.old_processing_status) }}
              </VChip>
              <VIcon
                v-if="entry.old_processing_status && entry.new_processing_status"
                icon="tabler-arrow-right"
                size="14"
              />
              <VChip
                v-if="entry.new_processing_status"
                :color="statusColor(entry.new_processing_status)"
                size="x-small"
                label
              >
                {{ statusLabel(entry.new_processing_status) }}
              </VChip>
            </div>
          </div>

          <!-- % Hoàn thành -->
          <div
            v-if="entry.new_completion_percent !== undefined && entry.new_completion_percent !== null"
            class="report-section mb-4"
          >
            <div class="report-section-content text-body-1 text-high-emphasis mb-1">
              % Hoàn thành
            </div>
            <div class="report-section-label text-caption text-medium-emphasis font-weight-medium">
              {{ entry.old_completion_percent ?? 0 }}% → {{ entry.new_completion_percent }}%
            </div>
          </div>

          <!-- Ghi chú -->
          <div
            v-if="entry.note"
            class="report-section mb-4"
          >
            <div class="report-section-content text-body-1 text-high-emphasis mb-1">
              Ghi chú
            </div>
            <div
              class="report-section-label text-caption text-medium-emphasis font-weight-medium"
              style="white-space: pre-wrap;"
            >
              {{ entry.note }}
            </div>
          </div>

          <!-- Người cập nhật -->
          <div
            v-if="entry.user_name"
            class="report-section"
          >
            <div class="report-section-content text-body-1 text-high-emphasis mb-1">
              Người cập nhật
            </div>
            <div class="report-section-label text-caption text-medium-emphasis font-weight-medium">
              {{ entry.user_name }}
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
