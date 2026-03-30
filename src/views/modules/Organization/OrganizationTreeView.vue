<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import OrganizationTreeNode from './OrganizationTreeNode.vue'
import OrganizationFormDrawer from './OrganizationFormDrawer.vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useOrganizationStore } from '@/store/modules/organization'
// eslint-disable-next-line import/extensions, import/no-unresolved
import type { Organization } from '@/api/modules/organization'

const orgStore = useOrganizationStore()

const isLoading = ref(false)
const isFormDrawerVisible = ref(false)
const editingOrg = ref<Organization | null>(null)
const searchQuery = ref('')

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const loadTree = async () => {
  isLoading.value = true
  try {
    await orgStore.fetchTree()
  }
  finally {
    isLoading.value = false
  }
}

// Tìm kiếm trong cây (highlight/filter node có tên chứa query)
const filterTree = (nodes: Organization[], query: string | null): Organization[] => {
  if (!query?.trim())
    return nodes

  const q = query.toLowerCase()

  return nodes.reduce<Organization[]>((acc, node) => {
    const filteredChildren = filterTree(node.children ?? [], q)
    const matches = node.name.toLowerCase().includes(q)

    if (matches || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : (matches ? node.children : []),
      })
    }

    return acc
  }, [])
}

const filteredTree = computed(() => filterTree(orgStore.tree, searchQuery.value ?? ''))

// Đếm tổng số node trong cây
const countNodes = (nodes: Organization[]): number =>
  nodes.reduce((acc, n) => acc + 1 + countNodes(n.children ?? []), 0)

const totalNodes = computed(() => countNodes(orgStore.tree))
const filteredNodes = computed(() => countNodes(filteredTree.value))

const openEditDrawer = (org: Organization) => {
  editingOrg.value = org
  isFormDrawerVisible.value = true
}

const handleFormSubmit = async () => {
  isFormDrawerVisible.value = false
  await Promise.all([loadTree(), orgStore.fetchStats()])
}

const handleToggleStatus = async (org: Organization) => {
  try {
    const newStatus = org.status === 'active' ? 'inactive' : 'active'

    await orgStore.changeStatus(org.id, newStatus)
    showToast('Cập nhật trạng thái thành công!', 'success')
    await loadTree()
    await orgStore.fetchStats()
  }
  catch {
    showToast('Cập nhật trạng thái thất bại!', 'error')
  }
}

onMounted(loadTree)

defineExpose({ reload: loadTree })
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h5 class="text-h5 font-weight-bold">
          Cây tổ chức
        </h5>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Toàn bộ cấu trúc phân cấp tổ chức trong hệ thống
        </p>
      </div>
      <VBtn
        variant="tonal"
        color="primary"
        prepend-icon="tabler-refresh"
        :loading="isLoading"
        @click="loadTree"
      >
        Làm mới
      </VBtn>
    </div>

    <!-- Toolbar -->
    <VCard
      elevation="0"
      border
      class="mb-4"
    >
      <VCardText class="d-flex align-center gap-4 py-3">
        <!-- Search -->
        <AppTextField
          v-model="searchQuery"
          placeholder="Tìm kiếm tổ chức..."
          prepend-inner-icon="tabler-search"
          clearable
          style="max-inline-size: 320px;"
        />

        <VSpacer />

        <!-- Counter -->
        <div class="text-body-2 text-medium-emphasis d-flex align-center gap-2">
          <VIcon
            icon="tabler-building"
            size="16"
          />
          <span v-if="searchQuery">
            {{ filteredNodes }} / {{ totalNodes }} tổ chức
          </span>
          <span v-else>
            {{ totalNodes }} tổ chức
          </span>
        </div>
      </VCardText>
    </VCard>

    <!-- Loading -->
    <div
      v-if="isLoading"
      class="d-flex justify-center align-center py-16"
    >
      <VProgressCircular
        indeterminate
        size="48"
        color="primary"
      />
    </div>

    <!-- Empty -->
    <VCard
      v-else-if="!filteredTree.length"
      elevation="0"
      border
    >
      <VCardText class="text-center py-16">
        <VIcon
          :icon="searchQuery ? 'tabler-search-off' : 'tabler-building-off'"
          size="56"
          color="disabled"
          class="mb-4"
        />
        <div class="text-body-1 text-disabled">
          {{ searchQuery ? 'Không tìm thấy tổ chức nào' : 'Chưa có tổ chức nào' }}
        </div>
      </VCardText>
    </VCard>

    <!-- Tree -->
    <VCard
      v-else
      elevation="0"
      border
    >
      <!-- Legend -->
      <VCardText class="d-flex align-center gap-4 py-3 border-b">
        <span class="text-body-2 text-medium-emphasis font-weight-medium">Chú thích:</span>
        <div class="d-flex align-center gap-1">
          <div
            class="rounded-circle"
            style="width:10px;height:10px;background:rgb(var(--v-theme-success))"
          />
          <span class="text-body-2">Đang hoạt động</span>
        </div>
        <div class="d-flex align-center gap-1">
          <div
            class="rounded-circle"
            style="width:10px;height:10px;background:rgb(var(--v-theme-error))"
          />
          <span class="text-body-2">Không hoạt động</span>
        </div>
        <span class="text-caption text-disabled ms-2">
          (Click vào badge trạng thái để thay đổi · Click ▶ để mở rộng/thu gọn)
        </span>
      </VCardText>

      <!-- Tree nodes -->
      <div class="pa-2">
        <OrganizationTreeNode
          v-for="node in filteredTree"
          :key="node.id"
          :node="node"
          :depth="0"
          @edit="openEditDrawer"
          @toggle-status="handleToggleStatus"
        />
      </div>
    </VCard>

    <!-- Form Drawer -->
    <OrganizationFormDrawer
      v-model:is-drawer-open="isFormDrawerVisible"
      :organization="editingOrg"
      @submit="handleFormSubmit"
    />

    <!-- Toast Snackbar -->
    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="top end"
      :timeout="3000"
    >
      {{ snackbar.message }}
      <template #actions>
        <VBtn
          variant="text"
          @click="snackbar.show = false"
        >
          Đóng
        </VBtn>
      </template>
    </VSnackbar>
  </div>
</template>
