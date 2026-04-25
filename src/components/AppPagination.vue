<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  total: number
  page: number
  limit: number
  limitOptions?: number[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  limitOptions: () => [10, 15, 20, 50, 100],
  loading: false,
})

const emit = defineEmits<{
  'update:page': [value: number]
  'update:limit': [value: number]
}>()

const totalPages = computed(() => Math.ceil(props.total / props.limit) || 1)
const startItem = computed(() => props.total === 0 ? 0 : (props.page - 1) * props.limit + 1)
const endItem = computed(() => Math.min(props.page * props.limit, props.total))
</script>

<template>
  <div
    v-if="total > 0"
    class="d-flex align-center justify-space-between flex-wrap px-4 py-3 gap-4"
  >
    <!-- Left: items per page + showing info -->
    <div class="d-flex align-center gap-3">
      <span class="text-disabled mb-0">Hiển thị</span>
      <VSelect
        :model-value="limit"
        :items="limitOptions"
        density="compact"
        style="min-inline-size: 75px;"
        hide-details
        :disabled="loading"
        @update:model-value="emit('update:limit', parseInt(String($event), 10))"
      />
      <span class="text-disabled mb-0">
        trong {{ total }} kết quả
        ({{ startItem }}–{{ endItem }})
      </span>
    </div>

    <!-- Right: page navigation -->
    <VPagination
      :model-value="page"
      :length="totalPages"
      :total-visible="5"
      color="primary"
      :disabled="loading"
      show-first-last-page
      first-icon="tabler-chevrons-left"
      prev-icon="tabler-chevron-left"
      next-icon="tabler-chevron-right"
      last-icon="tabler-chevrons-right"
      @update:model-value="emit('update:page', $event)"
    />
  </div>
</template>
