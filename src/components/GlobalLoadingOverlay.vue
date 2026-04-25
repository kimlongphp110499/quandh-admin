<script setup lang="ts">
import { computed } from 'vue'
import { useGlobalLoadingStore } from '@/store/modules/global-loading'

const store = useGlobalLoadingStore()
const isLoading = computed(() => store.isLoading)
</script>

<template>
  <div
    v-if="isLoading"
    class="global-loading-overlay"
  >
    <div class="loader-wrapper">
      <VProgressCircular
        indeterminate
        size="56"
        color="primary"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.global-loading-overlay {
  position: fixed;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 28%);
  inset: 0;
}

.loader-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface), 0.95);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 12%);
}
</style>
