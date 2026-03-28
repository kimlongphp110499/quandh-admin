<script setup lang="ts">
import { ref } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import type { Organization } from '@/api/modules/organization'

interface Props {
  node: Organization
  depth?: number
}

interface Emit {
  (e: 'edit', org: Organization): void
  (e: 'toggleStatus', org: Organization): void
}

const props = withDefaults(defineProps<Props>(), { depth: 0 })
const emit = defineEmits<Emit>()

const isExpanded = ref(true)

const hasChildren = props.node.children && props.node.children.length > 0

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const statusColor = (status: string) => status === 'active' ? 'success' : 'error'
const statusLabel = (status: string) => status === 'active' ? 'Hoạt động' : 'Không HĐ'

// Màu nền xen kẽ theo cấp độ
const depthColors = ['primary', 'info', 'success', 'warning', 'secondary']
const nodeColor = depthColors[props.depth % depthColors.length]
</script>

<template>
  <div>
    <!-- Node row -->
    <div
      class="org-tree-node d-flex align-center gap-3 py-2 px-3 rounded cursor-pointer"
      :style="{ paddingLeft: `${(depth * 28) + 12}px` }"
      :class="{ 'has-children': hasChildren }"
    >
      <!-- Expand/Collapse toggle -->
      <div style="width: 24px; flex-shrink: 0;">
        <VBtn
          v-if="hasChildren"
          :icon="isExpanded ? 'tabler-chevron-down' : 'tabler-chevron-right'"
          size="x-small"
          variant="text"
          color="secondary"
          @click.stop="toggleExpand"
        />
        <VIcon
          v-else
          icon="tabler-minus"
          size="14"
          color="secondary"
          class="opacity-40"
        />
      </div>

      <!-- Org icon + name -->
      <div class="d-flex align-center gap-2 flex-grow-1">
        <VAvatar
          :color="nodeColor"
          variant="tonal"
          size="32"
          rounded
        >
          <VIcon
            :icon="hasChildren ? 'tabler-building' : 'tabler-building-community'"
            size="16"
          />
        </VAvatar>

        <div>
          <span class="font-weight-medium text-high-emphasis">{{ node.name }}</span>
          <small
            v-if="node.description"
            class="d-block text-disabled"
          >
            {{ node.description }}
          </small>
        </div>
      </div>

      <!-- Children count badge -->
      <VChip
        v-if="hasChildren"
        size="x-small"
        :color="nodeColor"
        variant="tonal"
      >
        {{ node.children!.length }} đơn vị con
      </VChip>

      <!-- Depth badge -->
      <VChip
        size="x-small"
        variant="outlined"
        color="secondary"
      >
        Cấp {{ (node.depth ?? depth) + 1 }}
      </VChip>

      <!-- Status -->
      <VChip
        :color="statusColor(node.status)"
        size="small"
        class="cursor-pointer"
        @click.stop="emit('toggleStatus', node)"
      >
        {{ statusLabel(node.status) }}
      </VChip>

      <!-- Actions -->
      <div class="d-flex gap-1 flex-shrink-0">
        <IconBtn
          size="small"
          @click.stop="emit('edit', node)"
        >
          <VIcon icon="tabler-edit" size="18" />
          <VTooltip activator="parent" location="top">Sửa</VTooltip>
        </IconBtn>
      </div>
    </div>

    <!-- Children (recursive) -->
    <div v-if="hasChildren && isExpanded">
      <OrganizationTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        @edit="emit('edit', $event)"
        @toggleStatus="emit('toggleStatus', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.org-tree-node {
  transition: background-color 0.15s ease;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.06);
}

.org-tree-node:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}
</style>
