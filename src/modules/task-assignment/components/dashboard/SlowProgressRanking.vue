<script setup lang="ts">
interface RankItem {
  id: number | null
  name: string
  total: number
  overdue: number
  done: number
}

interface Props {
  title: string
  items: RankItem[]
  loading?: boolean
  avatarIcon?: string
}

withDefaults(defineProps<Props>(), {
  loading: false,
  avatarIcon: 'tabler-user',
})

const overdueRate = (item: RankItem) =>
  item.total > 0 ? Math.round((item.overdue / item.total) * 100) : 0

const progressColor = (rate: number) => {
  if (rate >= 60)
    return 'error'
  if (rate >= 30)
    return 'warning'

  return 'info'
}

const avatarColors = ['primary', 'success', 'error', 'warning', 'info', 'secondary']
</script>

<template>
  <VCard>
    <VCardItem :title="title">
      <template #append>
        <VChip
          color="error"
          size="small"
          variant="tonal"
        >
          Top quá hạn
        </VChip>
      </template>
    </VCardItem>

    <VCardText>
      <div
        v-if="loading"
        class="d-flex justify-center align-center py-8"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>

      <div
        v-else-if="!items.length"
        class="text-center text-medium-emphasis py-8"
      >
        Không có dữ liệu
      </div>

      <div
        v-else
        class="d-flex flex-column gap-y-5"
      >
        <div
          v-for="(item, index) in items"
          :key="item.id ?? index"
          class="d-flex align-center gap-x-4"
        >
          <!-- Rank + Avatar -->

          <!-- Name + Progress -->
          <div class="flex-grow-1 overflow-hidden">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-base font-weight-medium">
                {{ item.name || 'Chưa phân công' }}
              </span>
              <span class="text-caption text-error flex-shrink-0 ms-2">
                {{ item.overdue }}/{{ item.total }} quá hạn
              </span>
            </div>
            <VProgressLinear
              :model-value="overdueRate(item)"
              :color="progressColor(overdueRate(item))"
              rounded
              :height="6"
              bg-color="rgba(var(--v-border-color), var(--v-border-opacity))"
            />
          </div>

          <!-- Rate badge -->
          <VChip
            :color="progressColor(overdueRate(item))"
            size="small"
            variant="tonal"
            class="flex-shrink-0"
          >
            {{ overdueRate(item) }}%
          </VChip>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>
