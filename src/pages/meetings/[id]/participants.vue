<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
// eslint-disable-next-line import/no-unresolved
import ParticipantManager from '@/views/modules/Meeting/ParticipantManager.vue'

definePage({
  meta: {
    action: 'participants.index',
    subject: 'Meetings',
  },
})

const route = useRoute()
const meetingId = computed(() => Number(route.params.id))
</script>

<template>
  <ParticipantManager :meeting-id="meetingId" />
</template>
