<script setup lang="ts">
import { useItemStore } from '../../stores/useItemStore'

const store = useItemStore()

onMounted(() => store.fetchStats())

const cards = computed(() => {
  const s = store.stats
  return [
    {
      icon: 'tabler-list-check',
      color: 'primary',
      title: 'Tổng công việc',
      value: s?.total ?? 0,
    },
    {
      icon: 'tabler-loader',
      color: 'info',
      title: 'Đang thực hiện',
      value: s?.in_progress ?? 0,
    },
    {
      icon: 'tabler-circle-check',
      color: 'success',
      title: 'Hoàn thành',
      value: s?.done ?? 0,
    },
    {
      icon: 'tabler-clock-exclamation',
      color: 'error',
      title: 'Quá hạn',
      value: s?.overdue ?? 0,
    },
  ]
})
</script>

<template>
  <VRow>
    <VCol
      v-for="(card, index) in cards"
      :key="index"
      cols="12"
      sm="6"
      md="3"
    >
      <VCard
        class="logistics-card-statistics cursor-pointer"
        :style="`border-block-end-color: rgb(var(--v-theme-${card.color}))`"
      >
        <VCardText>
          <div class="d-flex align-center gap-x-4 mb-1">
            <VAvatar
              variant="tonal"
              :color="card.color"
              rounded
            >
              <VIcon
                :icon="card.icon"
                size="28"
              />
            </VAvatar>
            <div v-if="store.isLoading">
              <VProgressCircular
                indeterminate
                :color="card.color"
                size="28"
                width="3"
              />
            </div>
            <h4
              v-else
              class="text-h4"
            >
              {{ card.value }}
            </h4>
          </div>
          <div class="text-body-1">
            {{ card.title }}
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss" scoped>
@use "@core/scss/base/mixins" as mixins;

.logistics-card-statistics {
  border-block-end-style: solid;
  border-block-end-width: 2px;

  &:hover {
    border-block-end-width: 3px;
    margin-block-end: -1px;

    @include mixins.elevation(8);

    transition: all 0.1s ease-out;
  }
}

.skin--bordered {
  .logistics-card-statistics {
    border-block-end-width: 2px;

    &:hover {
      border-block-end-width: 3px;
      margin-block-end: -2px;
      transition: all 0.1s ease-out;
    }
  }
}
</style>
