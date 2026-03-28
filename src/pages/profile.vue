<script setup lang="ts">
import { computed, ref } from 'vue'
import avatar1 from '@images/avatars/avatar-1.png'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useAuthStore } from '@/store/modules/auth'

const authStore = useAuthStore()

const userName = computed(() => authStore.user?.name || 'Người dùng')
const userEmail = computed(() => authStore.user?.email || '')
const userRoles = computed(() => authStore.userRoles)
const currentOrg = computed(() => authStore.currentOrganization)
const availableOrgs = computed(() => authStore.availableOrganizations)

const isSwitchingOrg = ref(false)
const switchError = ref('')

async function handleSwitchOrg(orgId: number) {
  if (orgId === authStore.currentOrganizationId)
    return

  try {
    isSwitchingOrg.value = true
    switchError.value = ''
    await authStore.switchOrganization(orgId)
    window.location.reload()
  }
  catch (err: any) {
    switchError.value = err.response?.data?.message || 'Chuyển tổ chức thất bại.'
  }
  finally {
    isSwitchingOrg.value = false
  }
}
</script>

<template>
  <VRow>
    <!-- Thông tin cá nhân -->
    <VCol cols="12" md="4">
      <VCard>
        <VCardText class="d-flex flex-column align-center text-center pt-8 pb-6">
          <VAvatar
            color="primary"
            variant="tonal"
            size="96"
            class="mb-4"
          >
            <VImg :src="avatar1" />
          </VAvatar>

          <h5 class="text-h5 mb-1">
            {{ userName }}
          </h5>

          <div class="d-flex gap-2 flex-wrap justify-center mb-3">
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

          <div
            v-if="currentOrg"
            class="d-flex align-center gap-1 text-body-2 text-medium-emphasis"
          >
            <VIcon
              icon="tabler-building"
              size="16"
            />
            {{ currentOrg.name }}
          </div>
        </VCardText>

        <VDivider />

        <VCardText>
          <div class="d-flex flex-column gap-3">
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="primary"
                variant="tonal"
                size="36"
                rounded
              >
                <VIcon
                  icon="tabler-mail"
                  size="18"
                />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Email
                </div>
                <div class="font-weight-medium">
                  {{ userEmail }}
                </div>
              </div>
            </div>

            <div
              v-if="currentOrg"
              class="d-flex align-center gap-3"
            >
              <VAvatar
                color="success"
                variant="tonal"
                size="36"
                rounded
              >
                <VIcon
                  icon="tabler-building"
                  size="18"
                />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Tổ chức hiện tại
                </div>
                <div class="font-weight-medium">
                  {{ currentOrg.name }}
                </div>
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Chi tiết & Đổi tổ chức -->
    <VCol
      cols="12"
      md="8"
    >
      <!-- Đổi tổ chức -->
      <VCard
        v-if="availableOrgs.length > 1"
        class="mb-6"
      >
        <VCardTitle class="pa-6 pb-3">
          Chuyển đổi tổ chức
        </VCardTitle>

        <VCardText>
          <VAlert
            v-if="switchError"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="switchError = ''"
          >
            {{ switchError }}
          </VAlert>

          <div class="d-flex flex-column gap-3">
            <VCard
              v-for="org in availableOrgs"
              :key="org.id"
              :variant="org.id === authStore.currentOrganizationId ? 'tonal' : 'outlined'"
              :color="org.id === authStore.currentOrganizationId ? 'primary' : undefined"
              class="cursor-pointer"
              @click="handleSwitchOrg(org.id)"
            >
              <VCardText class="d-flex align-center gap-3 py-3">
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="36"
                >
                  <VIcon icon="tabler-building" />
                </VAvatar>
                <span class="font-weight-medium">{{ org.name }}</span>
                <VSpacer />
                <VChip
                  v-if="org.id === authStore.currentOrganizationId"
                  color="primary"
                  size="small"
                  label
                >
                  Đang dùng
                </VChip>
                <VProgressCircular
                  v-else-if="isSwitchingOrg"
                  indeterminate
                  size="20"
                  width="2"
                />
              </VCardText>
            </VCard>
          </div>
        </VCardText>
      </VCard>

      <!-- Vai trò & quyền hạn -->
      <VCard>
        <VCardTitle class="pa-6 pb-3">
          Vai trò & Quyền hạn
        </VCardTitle>

        <VCardText>
          <div
            v-if="userRoles.length"
            class="mb-4"
          >
            <div class="text-subtitle-2 mb-2">
              Vai trò
            </div>
            <div class="d-flex gap-2 flex-wrap">
              <VChip
                v-for="role in userRoles"
                :key="role"
                color="primary"
                variant="tonal"
              >
                {{ role }}
              </VChip>
            </div>
          </div>

          <div v-if="authStore.userPermissions.length">
            <div class="text-subtitle-2 mb-2">
              Quyền hạn
            </div>
            <div class="d-flex gap-2 flex-wrap">
              <VChip
                v-for="perm in authStore.userPermissions"
                :key="perm"
                size="small"
                variant="outlined"
              >
                {{ perm }}
              </VChip>
            </div>
          </div>

          <div
            v-if="!userRoles.length && !authStore.userPermissions.length"
            class="text-medium-emphasis"
          >
            Không có thông tin vai trò.
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
