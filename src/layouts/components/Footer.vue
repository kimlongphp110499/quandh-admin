<script setup lang="ts">
import { computed } from 'vue'
// eslint-disable-next-line import/extensions
import { useSettingStore } from '@/store/modules/setting'

const settingStore = useSettingStore()

const copyright = computed(() => settingStore.settings.general?.copyright || `© ${new Date().getFullYear()} Hệ thống quản trị`)
const designedBy = computed(() => settingStore.settings.general?.designed_by || '')
</script>

<template>
  <div class="h-100 d-flex align-center justify-md-space-between justify-center flex-wrap gap-3">
    <!-- Footer: left -->
    <span class="text-medium-emphasis">
      {{ copyright }}
      <template v-if="designedBy">
        &mdash; Được thiết kế bởi
        <span class="text-primary font-weight-medium">{{ designedBy }}</span>
      </template>
    </span>
  </div>
</template>
