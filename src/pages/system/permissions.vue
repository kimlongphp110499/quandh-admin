<script setup lang="ts">
import PermissionList from '@/modules/core/views/permission/list/index.vue'


definePage({
  meta: {
    action: 'index',
    subject: 'Permissions',
  },
})
</script>

<template>
  <PermissionList />
</template>
