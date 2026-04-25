<!-- Source: vuexy-1070/vue-version/typescript-version/full-version/src/views/pages/user-profile/profile/ActivityTimeline.vue -->
<script lang="ts" setup>
interface TimelinePerson {
  name: string
  role: string
  avatar: string
}

interface TimelineItem {
  color: string
  title: string
  time: string
  desc: string
  chip?: string
  person?: TimelinePerson
}

interface Props {
  items: TimelineItem[]
}

defineProps<Props>()
</script>

<template>
  <VCard class="h-100">
    <VCardItem>
      <VCardTitle>Dòng thời gian</VCardTitle>
    </VCardItem>
    <VCardText>
      <VTimeline
        side="end"
        align="start"
        line-inset="8"
        truncate-line="start"
        density="compact"
      >
        <VTimelineItem
          v-for="item in items"
          :key="item.title"
          :dot-color="item.color"
          size="x-small"
        >
          <div class="d-flex justify-space-between align-center gap-2 flex-wrap mb-2">
            <span class="app-timeline-title">{{ item.title }}</span>
            <span class="app-timeline-meta">{{ item.time }}</span>
          </div>
          <div class="app-timeline-text mt-1">
            {{ item.desc }}
          </div>
          <div
            v-if="item.chip"
            class="d-inline-flex align-center timeline-chip mt-2"
          >
            <VIcon
              icon="tabler-file-type-pdf"
              size="20"
              color="error"
              class="me-2"
            />
            <span class="app-timeline-text font-weight-medium">{{ item.chip }}</span>
          </div>
          <div
            v-if="item.person"
            class="d-flex align-center mt-2"
          >
            <VAvatar
              size="32"
              :image="item.person.avatar"
              class="me-2"
            />
            <div class="d-flex flex-column">
              <p class="text-sm font-weight-medium text-medium-emphasis mb-0">
                {{ item.person.name }}
              </p>
              <span class="text-sm">{{ item.person.role }}</span>
            </div>
          </div>
        </VTimelineItem>
      </VTimeline>
    </VCardText>
  </VCard>
</template>
