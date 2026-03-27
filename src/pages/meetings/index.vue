<script setup lang="ts">
import MeetingList from '@/views/modules/Meeting/MeetingList.vue'

definePage({
  meta: {
    action: 'index',
    subject: 'Meetings',
  },
})
</script>

<template>
  <MeetingList />
</template>
