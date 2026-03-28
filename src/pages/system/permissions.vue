<script setup lang="ts">
import PermissionList from '@/views/modules/Permission/PermissionList.vue'

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
