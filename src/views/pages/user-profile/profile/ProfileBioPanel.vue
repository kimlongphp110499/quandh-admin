<!-- eslint-disable import/extensions, import/no-unresolved -->
<script setup lang="ts">
import avatar1 from '@images/avatars/avatar-1.png'
import { useAuthStore } from '@/store/modules/auth'

const emit = defineEmits<{
  (e: 'switch-org'): void
  (e: 'edit'): void
}>()

const authStore = useAuthStore()

const userName = computed(() => authStore.user?.name || 'Người dùng')
const userEmail = computed(() => authStore.user?.email || '')
const userRoles = computed(() => authStore.userRoles)
</script>

<template>
  <VCard>
    <VCardText class="text-center pt-10">
      <VAvatar
        :size="100"
        rounded
        color="primary"
        variant="tonal"
      >
        <VImg :src="avatar1" />
      </VAvatar>

      <h5 class="text-h5 mt-4">
        {{ userName }}
      </h5>
      <p class="text-body-1 text-medium-emphasis mb-4">
        {{ userEmail }}
      </p>

      <div class="d-flex gap-2 flex-wrap justify-center mb-4">
        <VChip
          v-for="role in userRoles"
          :key="role"
          color="primary"
          size="small"
          label
        >
          {{ role }}
        </VChip>
      </div>
    </VCardText>

    <VCardText>
      <h5 class="text-h5 mb-4">
        Chi tiết
      </h5>
      <VDivider class="mb-4" />

      <VList class="card-list">
        <VListItem>
          <VListItemTitle>
            <span class="text-h6">Họ tên: </span>
            <span class="text-body-1">{{ userName }}</span>
          </VListItemTitle>
        </VListItem>
        <VListItem>
          <VListItemTitle>
            <span class="text-h6">Email: </span>
            <span class="text-body-1">{{ userEmail }}</span>
          </VListItemTitle>
        </VListItem>
        <VListItem v-if="authStore.currentOrganizationDisplayName">
          <VListItemTitle>
            <span class="text-h6">Tổ chức: </span>
            <span class="text-body-1">{{ authStore.currentOrganizationDisplayName }}</span>
          </VListItemTitle>
        </VListItem>
        <VListItem v-if="userRoles.length">
          <VListItemTitle>
            <span class="text-h6">Vai trò: </span>
            <span class="text-body-1">{{ userRoles.join(', ') }}</span>
          </VListItemTitle>
        </VListItem>
      </VList>
    </VCardText>

    <VCardText class="d-flex justify-center gap-4">
      <VBtn
        v-if="authStore.availableOrganizations.length >= 1"
        prepend-icon="tabler-switch-3"
        @click="emit('switch-org')"
      >
        Đổi tổ chức
      </VBtn>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 0.5rem;
}
</style>
