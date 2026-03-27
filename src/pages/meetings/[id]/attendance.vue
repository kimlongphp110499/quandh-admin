<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
// eslint-disable-next-line import/no-unresolved
import AttendanceManager from '@/views/modules/Meeting/AttendanceManager.vue'

definePage({
  meta: {
    action: 'participants.checkin',
    subject: 'Meetings',
  },
})

const route = useRoute()
const meetingId = computed(() => Number(route.params.id))
</script>

<template>
  <AttendanceManager :meeting-id="meetingId" />
</template>
