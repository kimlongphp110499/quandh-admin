<script setup lang="ts">
import UserList from '@/modules/core/views/user/list/index.vue'

definePage({
  meta: {
    action: 'index',
    subject: 'Users',
  },
})
</script>

<template>
  <UserList />
</template>
