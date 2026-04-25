<!-- Source: quandh-frontend/src/views/apps/ecommerce/customer/view/CustomerBioPanel.vue -->
<script lang="ts" setup>
interface AboutItem {
  icon?: string
  property: string
  value: string
}

interface Props {
  about: AboutItem[]
  contacts?: AboutItem[]
  teams?: AboutItem[]
}

defineProps<Props>()
</script>

<template>
  <VCard class="h-100">
    <VCardText>
      <h5 class="text-h5">
        Chi tiết văn bản giao việc
      </h5>

      <VDivider class="my-4" />

      <VList class="card-list mt-2">
        <VListItem
          v-for="item in about"
          :key="item.property"
        >
          <h6 class="text-h6">
            {{ item.property }}:
            <span class="text-body-1 d-inline-block">{{ item.value }}</span>
          </h6>
        </VListItem>
      </VList>

      <template v-if="contacts?.length">
        <VDivider class="my-4" />

        <VList class="card-list mt-2">
          <VListItem
            v-for="item in contacts"
            :key="item.property"
          >
            <h6 class="text-h6">
              {{ item.property }}:
              <span class="text-body-1 d-inline-block">{{ item.value }}</span>
            </h6>
          </VListItem>
        </VList>
      </template>

      <template v-if="teams?.length">
        <VDivider class="my-4" />

        <VList class="card-list mt-2">
          <VListItem
            v-for="item in teams"
            :key="item.property"
          >
            <h6 class="text-h6">
              {{ item.property }}
              <span class="text-body-1 d-inline-block">{{ item.value }}</span>
            </h6>
          </VListItem>
        </VList>
      </template>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 0.5rem;
}
</style>
