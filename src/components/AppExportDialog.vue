<script setup lang="ts">
import { ref } from 'vue'

interface ExportScope {
  title: string
  value: string
}

interface Props {
  modelValue: boolean
  title?: string
  loading?: boolean
  /** Các lựa chọn phạm vi xuất, mặc định: dữ liệu đang lọc + toàn bộ */
  scopeOptions?: ExportScope[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'export', scope: string): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Xuất dữ liệu',
  loading: false,
  scopeOptions: () => [
    { title: 'Dữ liệu đang lọc', value: 'filtered' },
    { title: 'Toàn bộ dữ liệu', value: 'all' },
  ],
})

const emit = defineEmits<Emits>()

const selectedScope = ref(props.scopeOptions[0]?.value ?? 'filtered')

const onClose = () => {
  if (props.loading)
    return
  emit('update:modelValue', false)
}

const handleExport = () => {
  emit('export', selectedScope.value)
}
</script>

<template>
  <VDialog
    :model-value="props.modelValue"
    max-width="500"
    persistent
    @update:model-value="val => !props.loading && emit('update:modelValue', val)"
  >
    <VCard rounded="lg">
      <!-- Header -->
      <VCardTitle class="d-flex align-center justify-space-between pa-6 pb-4">
        <span class="text-h5">{{ props.title }}</span>
        <IconBtn
          :disabled="props.loading"
          @click="onClose"
        >
          <VIcon icon="tabler-x" />
        </IconBtn>
      </VCardTitle>

      <VCardText class="px-6 pb-2">
        <!-- Phạm vi xuất -->
        <div class="text-body-1 font-weight-medium mb-2">
          Phạm vi xuất
        </div>
        <AppSelect
          v-model="selectedScope"
          :items="props.scopeOptions"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="comfortable"
          hide-details
          class="mb-5"
        />

        <!-- Hint -->
        <VAlert
          color="success"
          variant="tonal"
          density="compact"
          prepend-icon="tabler-file-spreadsheet"
          class="text-body-2"
        >
          Dữ liệu sẽ được xuất dưới dạng tệp Excel <code>.xlsx</code> để mở trực tiếp bằng Microsoft Excel.
        </VAlert>
      </VCardText>

      <!-- Actions -->
      <VCardText class="d-flex align-center justify-end gap-3 px-6 pt-4 pb-6">
        <VBtn
          variant="tonal"
          color="secondary"
          :disabled="props.loading"
          @click="onClose"
        >
          Đóng
        </VBtn>
        <VBtn
          color="primary"
          prepend-icon="tabler-download"
          :loading="props.loading"
          @click="handleExport"
        >
          Xuất Dữ Liệu
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>
