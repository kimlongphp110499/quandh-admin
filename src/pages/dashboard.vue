<script setup lang="ts">
// eslint-disable-next-line import/no-unresolved
import DashboardView from '@/views/modules/Dashboard/DashboardView.vue'

definePage({
  meta: {
    action: 'index',
    subject: 'Dashboard',
  },
})
</script>

<template>
  <DashboardView />
</template>
