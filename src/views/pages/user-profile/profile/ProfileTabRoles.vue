<!-- eslint-disable import/extensions, import/no-unresolved -->
<script setup lang="ts">
import { useAuthStore } from '@/store/modules/auth'

const authStore = useAuthStore()

const userRoles = computed(() => authStore.userRoles)
const userPermissions = computed(() => authStore.userPermissions)

const groupedPermissions = computed(() => {
  const groups: Record<string, string[]> = {}
  userPermissions.value.forEach((perm: string) => {
    const [module] = perm.split('.')
    if (!groups[module]) groups[module] = []
    groups[module].push(perm)
  })
  return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
})

function getModuleName(module: string): string {
  const names: Record<string, string> = {
    'users': 'Người dùng',
    'roles': 'Vai trò',
    'permissions': 'Quyền hạn',
    'organizations': 'Tổ chức',
    'posts': 'Bài viết',
    'settings': 'Cài đặt',
    'log-activities': 'Nhật ký',
    'document-fields': 'Lĩnh vực',
    'document-types': 'Loại văn bản',
    'document-signers': 'Người ký',
    'documents': 'Văn bản',
    'issuing-agencies': 'Cơ quan ban hành',
    'issuing-levels': 'Cơ quan ban hành',
  }
  return names[module] || module
}

function getActionName(action: string): string {
  const names: Record<string, string> = {
    stats: 'Xem thống kê',
    index: 'Xem danh sách',
    show: 'Xem chi tiết',
    store: 'Tạo mới',
    create: 'Tạo mới',
    update: 'Cập nhật',
    destroy: 'Xóa',
    delete: 'Xóa',
    read: 'Đọc',
    manage: 'Quản lý',
  }
  return names[action] || action
}
</script>

<template>
  <VRow>
    <!-- Vai trò -->
    <VCol cols="12">
      <VCard title="Vai trò được gán">
        <VCardText>
          <div
            v-if="userRoles.length"
            class="d-flex gap-3 flex-wrap"
          >
            <VCard
              v-for="role in userRoles"
              :key="role"
              variant="tonal"
              color="primary"
            >
              <VCardText class="d-flex align-center gap-3 py-3 px-4">
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="36"
                  rounded
                >
                  <VIcon icon="tabler-user-shield" />
                </VAvatar>
                <span class="font-weight-semibold">{{ role }}</span>
              </VCardText>
            </VCard>
          </div>
          <div
            v-else
            class="d-flex flex-column align-center py-8 text-medium-emphasis"
          >
            <VIcon
              icon="tabler-user-off"
              size="48"
              class="mb-3"
            />
            <div class="text-body-1">
              Không có vai trò nào
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Quyền hạn -->
    <VCol cols="12">
      <VCard title="Quyền hạn">
        <VCardText>
          <div
            v-if="groupedPermissions.length"
            class="d-flex flex-column gap-5"
          >
            <div
              v-for="[module, perms] in groupedPermissions"
              :key="module"
            >
              <div class="d-flex align-center gap-2 mb-3">
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="28"
                  rounded
                >
                  <VIcon
                    icon="tabler-folder"
                    size="14"
                  />
                </VAvatar>
                <span class="text-body-1 font-weight-semibold">
                  {{ getModuleName(module) }}
                </span>
                <VChip
                  size="x-small"
                  color="primary"
                  variant="tonal"
                >
                  {{ perms.length }}
                </VChip>
              </div>
              <div class="d-flex gap-2 flex-wrap ms-10">
                <VChip
                  v-for="perm in perms"
                  :key="perm"
                  size="small"
                  variant="tonal"
                  color="secondary"
                >
                  {{ getActionName(perm.split('.')[1] || perm) }}
                </VChip>
              </div>
            </div>
          </div>
          <div
            v-else
            class="d-flex flex-column align-center py-8 text-medium-emphasis"
          >
            <VIcon
              icon="tabler-key-off"
              size="48"
              class="mb-3"
            />
            <div class="text-body-1">
              Không có quyền hạn nào
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
