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

const emit = defineEmits<{
  'settings': []
}>()

interface StatItem {
  label: string
  value: number
  icon: string
  color: string
}

const cardCount = computed(() => {
  let count = 0
  if (props.total !== undefined && props.total !== null)
    count++
  if (props.active !== undefined && props.active !== null)
    count++
  if (props.totalGroup !== undefined && props.totalGroup !== null)
    count++
  if (props.inactive !== undefined && props.inactive !== null)
    count++

  return count
})

const colProps = computed(() => {
  if (cardCount.value === 1)
    return { cols: '12', sm: '6' }
  if (cardCount.value === 2)
    return { cols: '12', sm: '6' }
  if (cardCount.value === 3)
    return { cols: '12', sm: '6', md: '4' }

  return { cols: '12', sm: '6', md: '3' }
})

const widgetData = computed<StatItem[]>(() => {
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
    <!-- 👉 Widgets -->
    <VCardText>
      <VRow>
        <template
          v-for="(data, id) in widgetData"
          :key="id"
        >
          <VCol
            v-bind="colProps"
            class="px-6"
          >
            <div
              class="d-flex justify-space-between"
              :class="$vuetify.display.xs
                ? id !== widgetData.length - 1 ? 'border-b pb-4' : ''
                : $vuetify.display.sm
                  ? id < (widgetData.length / 2) ? 'border-b pb-4' : ''
                  : ''"
            >
              <div class="d-flex flex-column">
                <h4 class="text-h4">
                  {{ data.value }}
                </h4>

                <div class="text-body-1">
                  {{ data.label }}
                </div>
              </div>

              <VAvatar
                :color="data.color"
                variant="tonal"
                rounded
                size="42"
              >
                <VIcon
                  :icon="data.icon"
                  size="26"
                  class="text-high-emphasis"
                />
              </VAvatar>
            </div>
          </VCol>

          <VDivider
            v-if="$vuetify.display.mdAndUp ? id !== widgetData.length - 1
              : $vuetify.display.smAndUp ? id % 2 === 0
                : false"
            vertical
            inset
            length="60"
          />
        </template>
      </VRow>
    </VCardText>
  </VCard>
</template>
