<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
// eslint-disable-next-line import/no-unresolved
import AgendaEditor from '@/views/modules/Meeting/AgendaEditor.vue'

definePage({
  meta: {
    action: 'agendas.index',
    subject: 'Meetings',
  },
})

const route = useRoute()
const meetingId = computed(() => Number(route.params.id))
</script>

<template>
  <AgendaEditor :meeting-id="meetingId" />
</template>
