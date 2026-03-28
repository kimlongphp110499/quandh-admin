<script setup lang="ts">
definePage({
  meta: {
    action: 'index',
    subject: 'Setting',
  },
})
</script>

<template>
  <VCard>
    <VCardTitle class="pa-6 d-flex align-center gap-3">
      <VIcon
        icon="tabler-settings"
        size="24"
      />
      Cấu hình hệ thống
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
