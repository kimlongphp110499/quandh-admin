<script setup lang="ts">
// eslint-disable-next-line import/no-unresolved
import OrganizationList from '@/views/modules/Organization/OrganizationList.vue'

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
