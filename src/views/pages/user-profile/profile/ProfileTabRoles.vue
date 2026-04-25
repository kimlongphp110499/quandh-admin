<!-- eslint-disable import/extensions, import/no-unresolved -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { usePermissionStore } from '@/modules/core/stores/usePermissionStore'
import type { Permission } from '@/modules/core/services/permissionApi'

const authStore = useAuthStore()
const permissionStore = usePermissionStore()

const userRoles = computed(() => authStore.userRoles)
const userPermissions = computed<string[]>(() => authStore.userPermissions)

// Map tên permission → object từ tree (dùng description làm label hiển thị)
const permissionByName = computed(() => {
  const map = new Map<string, Permission>()
  const walk = (nodes: Permission[]) => {
    nodes.forEach(node => {
      map.set(node.name, node)
      if (node.children?.length)
        walk(node.children)
    })
  }
  walk(permissionStore.permissionTree)
  return map
})

// Nhóm theo group cha (parent) từ tree, fallback về split('.') nếu không có trong tree
const groupedPermissions = computed(() => {
  const groups = new Map<string, { label: string; perms: { name: string; label: string }[] }>()

  userPermissions.value.forEach((permName: string) => {
    const node = permissionByName.value.get(permName)
    const parent = node?.parent_id
      ? permissionStore.permissionTree.find(g => g.id === node.parent_id)
      : null

    const groupKey = parent?.name ?? permName.split('.')[0] ?? permName
    const groupLabel = parent?.description ?? groupKey

    if (!groups.has(groupKey))
      groups.set(groupKey, { label: groupLabel, perms: [] })

    groups.get(groupKey)!.perms.push({
      name: permName,
      label: node?.description ?? permName,
    })
  })

  return [...groups.entries()].sort((a, b) => a[1].label.localeCompare(b[1].label))
})

onMounted(() => {
  if (!permissionStore.permissionTree.length)
    permissionStore.fetchTree()
})
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
              v-for="[groupKey, group] in groupedPermissions"
              :key="groupKey"
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
                  {{ group.label }}
                </span>
                <VChip
                  size="x-small"
                  color="primary"
                  variant="tonal"
                >
                  {{ group.perms.length }}
                </VChip>
              </div>
              <div class="d-flex gap-2 flex-wrap ms-10">
                <VChip
                  v-for="perm in group.perms"
                  :key="perm.name"
                  size="small"
                  variant="tonal"
                  color="secondary"
                >
                  {{ perm.label }}
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
