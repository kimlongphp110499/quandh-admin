<script setup lang="ts">
import RoleList from '@/modules/core/views/role/list/index.vue'

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
