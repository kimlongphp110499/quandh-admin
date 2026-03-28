<script setup lang="ts">
import RoleList from '@/views/modules/Role/RoleList.vue'

definePage({
  meta: {
    action: 'index',
    subject: 'Roles',
  },
})
</script>

<template>
  <RoleList />
</template>
