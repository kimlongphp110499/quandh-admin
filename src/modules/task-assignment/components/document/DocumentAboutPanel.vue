<!-- Source: vuexy-1070/vue-version/typescript-version/full-version/src/views/pages/user-profile/profile/About.vue -->
<script lang="ts" setup>
interface AboutItem {
  icon?: string
  property: string
  value: string
}

interface Props {
  about: AboutItem[]
  contacts: AboutItem[]
  teams: AboutItem[]
}

defineProps<Props>()
</script>

<template>
  <div class="h-100">
    <VCard class="h-100">
    <VCardItem>
      <VCardTitle>Chi tiết văn bản giao việc</VCardTitle>
    </VCardItem>
      <VCardText>
        <VList class="card-list text-medium-emphasis">
          <VListItem v-for="item in about" :key="item.property">
            <VListItemTitle>
              <span class="d-flex align-center">
                <VIcon :icon="item.icon" size="24" class="me-2" />
                <div class="text-body-1 font-weight-medium me-2">
                  {{ item.property }}:
                </div>
                <div>{{ item.value }}</div>
              </span>
            </VListItemTitle>
          </VListItem>
        </VList>
      </VCardText>
    </VCard>
  </div>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 16px;
}
</style>
