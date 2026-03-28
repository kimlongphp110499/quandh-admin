<script setup lang="ts">
import UserList from '@/views/modules/User/UserList.vue'

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
