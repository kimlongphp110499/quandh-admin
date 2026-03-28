<script setup lang="ts">
import ActivityLogList from '@/views/modules/ActivityLog/ActivityLogList.vue'

definePage({
  meta: {
    action: 'index',
    subject: 'LogActivities',
  },
})
</script>

<template>
  <ActivityLogList />
</template>
