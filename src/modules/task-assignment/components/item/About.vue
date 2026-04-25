<!-- Source: quandh-frontend/src/views/apps/ecommerce/customer/view/CustomerBioPanel.vue -->
<script lang="ts" setup>
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { Item } from '../../services/itemApi'

const props = defineProps<Props>()

dayjs.extend(customParseFormat)

interface Props {
  item: Item
}

const resolveStatusColor = (s: string) =>
  ({ todo: 'default', in_progress: 'info', done: 'success', overdue: 'error', paused: 'warning', cancelled: 'secondary' }[s] || 'default')

const resolveStatusLabel = (s: string) =>
  ({ todo: 'Chưa bắt đầu', in_progress: 'Đang thực hiện', done: 'Hoàn thành', overdue: 'Quá hạn', paused: 'Tạm dừng', cancelled: 'Đã hủy' }[s] || s)

const resolvePriorityColor = (p: string) =>
  ({ low: 'default', medium: 'info', high: 'warning', urgent: 'error' }[p] || 'default')

const resolvePriorityLabel = (p: string) =>
  ({ low: 'Thấp', medium: 'Bình thường', high: 'Cao', urgent: 'Khẩn cấp' }[p] || p)

const formatDate = (dateStr?: string | null) => {
  if (!dateStr)
    return '—'
  const normalized = dateStr.replace(' ', 'T')
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime()))
    return dateStr

  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<template>
  <VCard>
    <VCardText>
      <h5 class="text-h5">
        Thông tin công việc
      </h5>

      <VDivider class="my-4" />

      <VList class="card-list mt-2">
        <VListItem>
          <h6 class="text-h6">
            Tên công việc:
            <span class="text-body-1 d-inline-block">{{ props.item.name }}</span>
          </h6>
        </VListItem>

        <VListItem>
          <div class="d-flex gap-x-2 align-center">
            <h6 class="text-h6">
              Trạng thái:
            </h6>
            <VChip
              :color="resolveStatusColor(props.item.processing_status)"
              size="small"
              label
            >
              {{ resolveStatusLabel(props.item.processing_status) }}
            </VChip>
          </div>
        </VListItem>

        <VListItem v-if="props.item.priority">
          <div class="d-flex gap-x-2 align-center">
            <h6 class="text-h6">
              Mức độ ưu tiên:
            </h6>
            <VChip
              :color="resolvePriorityColor(props.item.priority)"
              size="small"
              label
            >
              {{ resolvePriorityLabel(props.item.priority) }}
            </VChip>
          </div>
        </VListItem>

        <VListItem>
          <h6 class="text-h6">
            % Hoàn thành:
            <span class="text-body-1 d-inline-block">{{ props.item.completion_percent }}%</span>
          </h6>
        </VListItem>

        <VListItem>
          <h6 class="text-h6">
            Ngày bắt đầu:
            <span class="text-body-1 d-inline-block">{{ formatDate(props.item.start_at) }}</span>
          </h6>
        </VListItem>

        <VListItem>
          <h6 class="text-h6">
            Ngày kết thúc:
            <span
              class="text-body-1 d-inline-block"
              :class="props.item.deadline_type === 'no_deadline' ? 'text-disabled' : ''"
            >
              {{ props.item.deadline_type === 'no_deadline' ? 'Không có thời hạn' : formatDate(props.item.end_at) }}
            </span>
          </h6>
        </VListItem>

        <VListItem v-if="props.item.completed_at">
          <h6 class="text-h6">
            Ngày hoàn thành:
            <span class="text-body-1 d-inline-block">{{ formatDate(props.item.completed_at) }}</span>
          </h6>
        </VListItem>

        <VListItem v-if="props.item.document">
          <h6 class="text-h6">
            Văn bản giao việc:
            <RouterLink
              :to="{ name: 'task-assignment-documents-id', params: { id: props.item.document.id } }"
              class="text-body-1 d-inline-block"
            >
              {{ props.item.document.name }}
            </RouterLink>
          </h6>
        </VListItem>

        <VListItem v-if="props.item.item_type">
          <h6 class="text-h6">
            Loại công việc:
            <span class="text-body-1 d-inline-block">{{ props.item.item_type.name }}</span>
          </h6>
        </VListItem>
        <VListItem v-if="props.item.item_type">
          <h6 class="text-h6">
            Mô tả:
            <span class="text-body-1 d-inline-block">{{ props.item.description }}</span>
          </h6>
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 0.5rem;
}
</style>
