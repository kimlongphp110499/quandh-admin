<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  total?: number
  totalGroup?: number
  active?: number
  inactive?: number
  totalLabel?: string
  activeLabel?: string
  inactiveLabel?: string
  totalGroupLabel?: string
  totalIcon?: string
  activeIcon?: string
  inactiveIcon?: string
  totalGroupIcon?: string
  showSettings?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  totalLabel: 'Tổng',
  activeLabel: 'Hoạt động',
  inactiveLabel: 'Không hoạt động',
  totalGroupLabel: '',
  totalIcon: 'tabler-list',
  activeIcon: 'tabler-circle-check',
  inactiveIcon: 'tabler-circle-x',
  totalGroupIcon: 'tabler-folder',
  showSettings: true,
})

interface StatItem {
  label: string
  value: number
  icon: string
  color: string
}

const emit = defineEmits<{
  'settings': []
}>()

const stats = computed<StatItem[]>(() => {
  const items: StatItem[] = []
  if (props.total !== undefined && props.total !== null)
    items.push({ label: props.totalLabel, value: props.total, icon: props.totalIcon, color: 'primary' })
  if (props.active !== undefined && props.active !== null)
    items.push({ label: props.activeLabel, value: props.active, icon: props.activeIcon, color: 'success' })
  if (props.totalGroup !== undefined && props.totalGroup !== null)
    items.push({ label: props.totalGroupLabel, value: props.totalGroup, icon: props.totalGroupIcon, color: 'warning' })
  if (props.inactive !== undefined && props.inactive !== null)
    items.push({ label: props.inactiveLabel, value: props.inactive, icon: props.inactiveIcon, color: 'error' })

  return items
})
</script>

<template>
  <VCard class="mb-6">
    <VCardText class="px-0 py-0">
      <VRow no-gutters>
        <VCol
          v-for="(stat, index) in stats"
          :key="stat.label"
          cols="12"
          sm="6"
          :md="stats.length <= 2 ? 6 : stats.length === 3 ? 4 : 3"
          :class="[
            'd-flex align-center',
            index < stats.length - 1 ? 'stat-col-border' : '',
          ]"
        >
          <div class="d-flex align-center justify-space-between w-100 pa-6">
            <div>
              <h4 class="text-h4 mb-1">
                {{ stat.value }}
              </h4>
              <span class="text-body-1 text-medium-emphasis">{{ stat.label }}</span>
            </div>
            <VAvatar
              :color="stat.color"
              variant="tonal"
              rounded
              size="42"
            >
              <VIcon
                :icon="stat.icon"
                size="26"
              />
            </VAvatar>
          </div>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<style scoped>
.stat-col-border {
  border-inline-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

@media (max-width: 959px) {
  .stat-col-border {
    border-inline-end: none;
    border-block-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }
}
</style>
