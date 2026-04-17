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

  // Do not default numeric props (total/active/inactive/totalGroup) to 0
  // so we can detect whether the parent passed them and only render
  // the cards when a value is provided.
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

// Count how many cards will be rendered
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

// Compute column breakpoints based on card count
const colProps = computed(() => {
  if (cardCount.value === 1)
    return { cols: '12', sm: '6' }
  if (cardCount.value === 2)
    return { cols: '12', sm: '6' }
  if (cardCount.value === 3)
    return { cols: '12', sm: '6', md: '4' }

  return { cols: '12', sm: '6', md: '3' }
})
</script>

<template>
  <VRow class="mb-6">
    <!-- Total Card -->
    <VCol
      v-if="total !== undefined && total !== null"
      v-bind="colProps"
    >
      <VCard>
        <VCardText>
          <div class="d-flex justify-space-between">
            <div class="d-flex flex-column gap-y-1">
              <div class="text-body-1 text-high-emphasis">
                {{ totalLabel }}
              </div>
              <h4 class="text-h4">
                {{ total }}
              </h4>
            </div>
            <VAvatar
              color="primary"
              variant="tonal"
              rounded
              size="42"
            >
              <VIcon
                :icon="totalIcon"
                size="26"
              />
            </VAvatar>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Active Card -->
    <VCol
      v-if="active !== undefined && active !== null"
      v-bind="colProps"
    >
      <VCard>
        <VCardText>
          <div class="d-flex justify-space-between">
            <div class="d-flex flex-column gap-y-1">
              <div class="text-body-1 text-high-emphasis">
                {{ activeLabel }}
              </div>
              <h4 class="text-h4">
                {{ active }}
              </h4>
            </div>
            <VAvatar
              color="success"
              variant="tonal"
              rounded
              size="42"
            >
              <VIcon
                :icon="activeIcon"
                size="26"
              />
            </VAvatar>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Group Card -->
    <VCol
      v-if="totalGroup !== undefined && totalGroup !== null"
      v-bind="colProps"
    >
      <VCard>
        <VCardText>
          <div class="d-flex justify-space-between">
            <div class="d-flex flex-column gap-y-1">
              <div class="text-body-1 text-high-emphasis">
                {{ totalGroupLabel }}
              </div>
              <h4 class="text-h4">
                {{ totalGroup }}
              </h4>
            </div>
            <VAvatar
              color="warning"
              variant="tonal"
              rounded
              size="42"
            >
              <VIcon
                :icon="totalGroupIcon"
                size="26"
              />
            </VAvatar>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Inactive Card -->
    <VCol
      v-if="inactive !== undefined && inactive !== null"
      v-bind="colProps"
    >
      <VCard>
        <VCardText>
          <div class="d-flex justify-space-between">
            <div class="d-flex flex-column gap-y-1">
              <div class="text-body-1 text-high-emphasis">
                {{ inactiveLabel }}
              </div>
              <h4 class="text-h4">
                {{ inactive }}
              </h4>
            </div>
            <VAvatar
              color="error"
              variant="tonal"
              rounded
              size="42"
            >
              <VIcon
                :icon="inactiveIcon"
                size="26"
              />
            </VAvatar>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
