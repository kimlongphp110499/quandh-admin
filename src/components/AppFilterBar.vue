<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  hasActiveFilters?: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  hasActiveFilters: false,
  title: 'Bộ lọc',
})

const isFilterExpanded = ref(false)
</script>

<template>
  <VCard
    elevation="0"
    border
    class="mb-4"
  >
    <!-- Header row: title (left) + actions (right) — always visible -->
    <div class="d-flex align-center gap-2 px-4 py-3">
      <!-- Mobile: clickable to expand/collapse filters -->
      <div
        class="d-flex d-md-none align-center gap-2 cursor-pointer"
        @click="isFilterExpanded = !isFilterExpanded"
      >
        <VIcon
          :icon="isFilterExpanded ? 'tabler-filter-off' : 'tabler-filter'"
          size="18"
        />
        <VIcon
          :icon="isFilterExpanded ? 'tabler-chevron-up' : 'tabler-chevron-down'"
          size="14"
          color="medium-emphasis"
        />
      </div>

      <!-- Desktop: static label -->
      <div class="d-none d-md-flex align-center gap-1">
        <VIcon
          icon="tabler-filter"
          size="18"
        />
        <span class="text-body-3 font-weight-semibold">{{ props.title }}</span>
      </div>

      <VSpacer />

      <!-- Action buttons — always visible on right -->
      <div class="d-flex align-center gap-1 gap-md-2 flex-wrap" style="max-width: 100%;">
        <slot name="actions" />
      </div>
    </div>

    <!-- Desktop: filter fields always visible below header -->
    <div class="d-none d-md-block">
      <div class="d-flex flex-wrap align-end gap-3 px-4 py-5">
        <slot name="filters" />
      </div>
    </div>

    <!-- Mobile: filter fields collapsible -->
    <VExpandTransition>
      <div
        v-show="isFilterExpanded"
        class="d-md-none"
      >
        <div class="d-flex flex-column gap-3 px-4 py-3">
          <slot name="filters" />
        </div>
      </div>
    </VExpandTransition>
  </VCard>
</template>
