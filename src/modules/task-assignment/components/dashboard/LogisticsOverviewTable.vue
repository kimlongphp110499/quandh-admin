<script setup lang="ts">
interface Header {
  title: string
  key: string
}

interface Props {
  title?: string
  headers: Header[]
  items: Record<string, any>[]
  loading?: boolean
  itemValue?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Thống kê',
  loading: false,
  itemValue: 'id',
})
</script>

<template>
  <VCard>
    <VCardItem :title="title" />

    <VDivider />

    <VDataTable
      :headers="headers"
      :items="items"
      :loading="loading"
      :item-value="itemValue"
      class="text-no-wrap"
      hide-default-footer
    >
      <template
        v-for="header in headers"
        #[`item.${header.key}`]="slotProps"
      >
        <slot
          :name="`item.${header.key}`"
          v-bind="slotProps"
        />
      </template>
    </VDataTable>
  </VCard>
</template>
