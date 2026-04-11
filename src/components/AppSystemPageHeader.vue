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
    return { cols: '6' }
  if (cardCount.value === 2)
    return { cols: '12', sm: '12', lg: '6' }
  if (cardCount.value === 3)
    return { cols: '12', sm: '6', lg: '4' }

  return { cols: '12', sm: '6', lg: '3' }
})
</script>

<template>
  <div>
    <!-- Stats Cards -->
    <VRow class="mb-2 align-stretch">
      <!-- Total Card -->
      <VCol
        v-if="total !== undefined && total !== null"
        v-bind="colProps"
        class="d-flex"
      >
        <VCard
          elevation="0"
          border
          class="w-100"
        >
          <VCardText class="d-flex align-center gap-4">
            <VAvatar
              color="primary"
              variant="tonal"
              size="48"
              rounded
            >
              <VIcon
                :icon="totalIcon"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ total }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ totalLabel }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Active Card -->
      <VCol
        v-if="active !== undefined && active !== null"
        v-bind="colProps"
        class="d-flex"
      >
        <VCard
          elevation="0"
          border
          class="w-100"
        >
          <VCardText class="d-flex align-center gap-4">
            <VAvatar
              color="success"
              variant="tonal"
              size="48"
              rounded
            >
              <VIcon
                :icon="activeIcon"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ active }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ activeLabel }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <!-- Group Card -->
      <VCol
        v-if="totalGroup !== undefined && totalGroup !== null"
        v-bind="colProps"
        class="d-flex"
      >
        <VCard
          elevation="0"
          border
          class="w-100"
        >
          <VCardText class="d-flex align-center gap-4">
            <VAvatar
              color="warning"
              variant="tonal"
              size="48"
              rounded
            >
              <VIcon
                :icon="totalGroupIcon"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ totalGroup }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ totalGroupLabel }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Inactive Card -->
      <VCol
        v-if="inactive !== undefined && inactive !== null"
        v-bind="colProps"
        class="d-flex"
      >
        <VCard
          elevation="0"
          border
          class="w-100"
        >
          <VCardText class="d-flex align-center gap-4">
            <VAvatar
              color="warning"
              variant="tonal"
              size="48"
              rounded
            >
              <VIcon
                :icon="inactiveIcon"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ inactive }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ inactiveLabel }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
