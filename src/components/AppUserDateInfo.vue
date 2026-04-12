<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { getUserInitials } from '@/utils/formatters'

dayjs.extend(customParseFormat)

const props = defineProps<{
  user?: string | null
  date?: string | null
  /** Dayjs format string. Mặc định: 'DD/MM/YYYY HH:mm:ss' */
  format?: string
}>()

/**
 * Chuẩn hoá chuỗi ngày từ backend trước khi parse.
 * Hỗ trợ các dạng:
 *   - "2026-04-05 13:00:53"   (ISO với space)
 *   - "13:00:53 05/04/2026"   (giờ trước, ngày sau)
 *   - "05/04/2026 13:00:53"   (ngày trước, giờ sau)
 */
function parseBackendDate(raw: string): dayjs.Dayjs {
  // Dạng: "HH:mm:ss DD/MM/YYYY"
  const timeFirst = raw.match(/^(\d{2}:\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})$/)
  if (timeFirst)
    return dayjs(`${timeFirst[2]} ${timeFirst[1]}`, 'DD/MM/YYYY HH:mm:ss')

  // Dạng: "DD/MM/YYYY HH:mm:ss"
  const dateFirst = raw.match(/^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})$/)
  if (dateFirst)
    return dayjs(raw, 'DD/MM/YYYY HH:mm:ss')

  // Dạng ISO "2026-04-05 13:00:53" hoặc "2026-04-05T13:00:53"
  return dayjs(raw.replace(' ', 'T'))
}

const formattedDate = computed(() => {
  if (!props.date)
    return ''
  const d = parseBackendDate(props.date)
  if (!d.isValid())
    return props.date
  return d.format(props.format || 'DD/MM/YYYY HH:mm:ss')
})
</script>

<template>
  <div class="d-flex flex-column gap-1 py-1">
    <div
      v-if="props.user && props.user !== 'N/A'"
      class="d-flex align-center gap-1"
    >
      <VAvatar
        size="18"
        color="secondary"
        variant="tonal"
      >
        <span style="font-size: 9px; font-weight: 600;">{{ getUserInitials(props.user) }}</span>
      </VAvatar>
      <span class="text-sm">{{ props.user }}</span>
    </div>
    <span
      v-if="props.date"
      class="text-sm text-medium-emphasis"
    >{{ formattedDate }}</span>
  </div>
</template>
