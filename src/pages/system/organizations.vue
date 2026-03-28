<script setup lang="ts">
import { ref } from 'vue'
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
        <OrganizationList />
      </VWindowItem>

      <VWindowItem value="tree">
        <OrganizationTreeView />
      </VWindowItem>

      <VWindowItem value="stats">
        <OrganizationStats />
      </VWindowItem>
    </VWindow>
  </div>
</template>
