<script setup lang="ts">
import OrganizationList from '@/modules/core/views/organization/list/index.vue'

definePage({
  meta: {
    action: 'index',
    subject: 'Organizations',
  },
})
</script>

<template>
  <div>
    <OrganizationList />
  </div>
</template>
