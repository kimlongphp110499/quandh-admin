<script setup lang="ts">
import { ref, watch } from 'vue'
// eslint-disable-next-line import/no-unresolved
import OrganizationList from '@/views/modules/Organization/OrganizationList.vue'
// eslint-disable-next-line import/no-unresolved
import OrganizationTreeView from '@/views/modules/Organization/OrganizationTreeView.vue'
// eslint-disable-next-line import/no-unresolved
import OrganizationStats from '@/views/modules/Organization/OrganizationStats.vue'

definePage({
  meta: {
    action: 'index',
    subject: 'Organizations',
  },
})

const activeTab = ref('list')

const listRef = ref<InstanceType<typeof OrganizationList>>()
const treeRef = ref<InstanceType<typeof OrganizationTreeView>>()
const statsRef = ref<InstanceType<typeof OrganizationStats>>()

// Reload dữ liệu mỗi khi chuyển tab
watch(activeTab, tab => {
  if (tab === 'list')
    listRef.value?.reload()
  else if (tab === 'tree')
    treeRef.value?.reload()
  else if (tab === 'stats')
    statsRef.value?.reload()
})
</script>

<template>
  <div>
    <!-- Tabs -->
    <VTabs
      v-model="activeTab"
      class="mb-6"
    >
      <VTab value="list">
        <VIcon
          icon="tabler-list"
          class="me-2"
          size="18"
        />
        Danh sách
      </VTab>
      <VTab value="tree">
        <VIcon
          icon="tabler-sitemap"
          class="me-2"
          size="18"
        />
        Cây tổ chức
      </VTab>
      <VTab value="stats">
        <VIcon
          icon="tabler-chart-bar"
          class="me-2"
          size="18"
        />
        Thống kê
      </VTab>
    </VTabs>

    <!-- Tab content -->
    <VWindow v-model="activeTab">
      <VWindowItem value="list">
        <OrganizationList ref="listRef" />
      </VWindowItem>

      <VWindowItem value="tree">
        <OrganizationTreeView ref="treeRef" />
      </VWindowItem>

      <VWindowItem value="stats">
        <OrganizationStats ref="statsRef" />
      </VWindowItem>
    </VWindow>
  </div>
</template>
