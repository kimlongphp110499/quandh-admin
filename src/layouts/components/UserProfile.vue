<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import avatar1 from '@images/avatars/avatar-1.png'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useAuthStore } from '@/store/modules/auth'

const authStore = useAuthStore()
const router = useRouter()

const userName = computed(() => authStore.user?.name || 'Người dùng')
const userEmail = computed(() => authStore.user?.email || '')
const userRole = computed(() => authStore.userRoles[0] || '')
const currentOrg = computed(() => authStore.currentOrganization)

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <VBadge
    dot
    location="bottom right"
    offset-x="3"
    offset-y="3"
    bordered
    color="success"
  >
    <VAvatar
      class="cursor-pointer"
      color="primary"
      variant="tonal"
    >
      <VImg :src="avatar1" />

      <VMenu
        activator="parent"
        width="240"
        location="bottom end"
        offset="14px"
      >
        <VList>
          <!-- User info -->
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                >
                  <VAvatar
                    color="primary"
                    variant="tonal"
                  >
                    <VImg :src="avatar1" />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <VListItemTitle class="font-weight-semibold">
              {{ userName }}
            </VListItemTitle>
            <VListItemSubtitle>{{ userRole || userEmail }}</VListItemSubtitle>
          </VListItem>

          <!-- Tổ chức hiện tại -->
          <VListItem
            v-if="currentOrg"
            density="compact"
            class="text-caption text-medium-emphasis"
          >
            <template #prepend>
              <VIcon
                icon="tabler-building"
                size="16"
                class="me-2 opacity-60"
              />
            </template>
            <VListItemTitle class="text-caption">
              {{ currentOrg.name }}
            </VListItemTitle>
          </VListItem>

          <VDivider class="my-2" />

          <!-- Trang cá nhân -->
          <VListItem :to="{ name: 'profile' }">
            <template #prepend>
              <VIcon
                class="me-2"
                icon="tabler-user-circle"
                size="22"
              />
            </template>
            <VListItemTitle>Trang cá nhân</VListItemTitle>
          </VListItem>

          <VDivider class="my-2" />

          <!-- Đăng xuất -->
          <VListItem @click="handleLogout">
            <template #prepend>
              <VIcon
                class="me-2"
                icon="tabler-logout"
                size="22"
              />
            </template>
            <VListItemTitle>Đăng xuất</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
    </VAvatar>
  </VBadge>
</template>
