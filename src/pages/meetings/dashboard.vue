<script setup lang="ts">
import MeetingDashboard from '@/views/modules/Meeting/MeetingDashboard.vue'

definePage({
  meta: {
    action: 'index',
    subject: 'Meetings',
  },
})
</script>

<template>
  <div>
    <h4 class="text-h4 mb-6">
      Tổng quan cuộc họp
    </h4>
    <MeetingDashboard />
  </div>
</template>
