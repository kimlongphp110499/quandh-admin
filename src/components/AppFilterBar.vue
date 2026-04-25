<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  hasActiveFilters?: boolean
  title?: string
  showFilters?: boolean
}

withDefaults(defineProps<Props>(), {
  hasActiveFilters: false,
  title: 'Bộ lọc',
  showFilters: true,
})

const isFilterExpanded = ref(false)
</script>

<template>
  <VCard class="mb-6">
    <template v-if="showFilters">
      <!-- ── Desktop: Vuexy-style title row ── -->
      <VCardItem class="pb-4 d-none d-md-flex">
        <VCardTitle>{{ title }}</VCardTitle>
      </VCardItem>

      <!-- ── Mobile: clickable header to toggle filters ── -->
      <div
        class="d-flex d-md-none align-center gap-2 px-4 py-3 cursor-pointer"
        @click="isFilterExpanded = !isFilterExpanded"
      >
        <VIcon
          :icon="isFilterExpanded ? 'tabler-filter-off' : 'tabler-filter'"
          size="18"
        />
        <span class="text-body-2 font-weight-semibold">{{ title }}</span>
        <VSpacer />
        <VIcon
          :icon="isFilterExpanded ? 'tabler-chevron-up' : 'tabler-chevron-down'"
          size="14"
          color="medium-emphasis"
        />
      </div>

      <!-- ── Desktop: filters always visible ── -->
      <VCardText class="d-none d-md-block">
        <VRow>
          <slot name="filters" />
        </VRow>
      </VCardText>

      <!-- ── Mobile: filters collapsible ── -->
      <VExpandTransition>
        <div
          v-show="isFilterExpanded"
          class="d-md-none"
        >
          <VCardText>
            <VRow>
              <slot name="filters" />
            </VRow>
          </VCardText>
        </div>
      </VExpandTransition>

      <VDivider />
    </template>

    <!-- ── Actions bar ── -->
    <VCardText class="d-flex flex-wrap gap-4">
      <VSpacer />
      <div class="d-flex align-center flex-wrap gap-4">
        <slot name="actions" />
      </div>
    </VCardText>

    <VDivider />

    <!-- ── Table content (default slot) ── -->
    <slot />
  </VCard>
</template>
