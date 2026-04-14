<script setup lang="ts">
// eslint-disable-next-line import/no-unresolved
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
