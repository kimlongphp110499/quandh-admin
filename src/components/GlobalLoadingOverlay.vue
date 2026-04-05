<script setup lang="ts">
import { computed } from 'vue'
import { useGlobalLoadingStore } from '@/store/modules/global-loading'

const store = useGlobalLoadingStore()
const isLoading = computed(() => store.isLoading)
</script>

<template>
  <div v-if="isLoading" class="global-loading-overlay">
    <div class="loader-wrapper">
      <VProgressCircular indeterminate size="56" color="primary" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.global-loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.28);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loader-wrapper {
  background: rgba(var(--v-theme-surface), 0.95);
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
</style>
