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

const handleLimitChange = (newLimit: number) => {
  emit('update:limit', newLimit)
}

const handlePageChange = (newPage: number) => {
  emit('update:page', newPage)
}
</script>

<template>
  <div
    v-if="total > 0"
    class="d-flex align-center justify-space-between px-4 py-3 border-t gap-2"
  >
    <!-- Left: Limit selector and total -->
    <div class="d-flex align-center gap-2 gap-md-3">
      <span class="d-none d-md-inline text-body-2 text-medium-emphasis">Hiển thị:</span>
      <VSelect
        :model-value="limit"
        :items="limitOptions"
        density="compact"
        style="min-inline-size: 70px;"
        hide-details
        :disabled="loading"
        @update:model-value="handleLimitChange"
      />
      <span class="d-none d-md-inline text-body-2 text-medium-emphasis">
        Tổng: {{ total }}
      </span>
    </div>

    <!-- Right: Page selector -->
    <div class="d-flex align-center gap-2">
      <VPagination
        :model-value="page"
        :length="totalPages"
        :total-visible="5"
        density="compact"
        :disabled="loading"
        show-first-last-page
        first-icon="tabler-chevrons-left"
        prev-icon="tabler-chevron-left"
        next-icon="tabler-chevron-right"
        last-icon="tabler-chevrons-right"
        @update:model-value="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.border-t {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
