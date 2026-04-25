<script setup lang="ts">
import ActivityLogList from '@/modules/core/views/activitylog/list/index.vue'

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
