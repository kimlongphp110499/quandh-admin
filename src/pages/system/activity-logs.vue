<script setup lang="ts">
definePage({
  meta: {
    action: 'index',
    subject: 'ActivityLog',
  },
})
</script>

<template>
  <VCard>
    <VCardTitle class="pa-6 d-flex align-center gap-3">
      <VIcon
        icon="tabler-history"
        size="24"
      />
      Nhật ký hoạt động
    </VCardTitle>

    <VCardText>
      <VAlert
        type="info"
        variant="tonal"
      >
        Tính năng đang được phát triển.
      </VAlert>
    </VCardText>
  </VCard>
</template>
