<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  confirmColor?: string
  loading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

// Gán giá trị mặc định cho props
const props = withDefaults(defineProps<Props>(), {
  title: 'Xác nhận',
  message: 'Bạn có chắc chắn muốn thực hiện hành động này?',
  confirmText: 'Xác nhận',
  cancelText: 'Hủy',
  confirmColor: 'primary',
  loading: false,
})

const emit = defineEmits<Emits>()

const onCancel = () => {
  emit('update:modelValue', false)
  emit('cancel')
}

const onConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <VDialog
    :model-value="props.modelValue"
    max-width="500"
    persistent
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <VCard class="text-center px-10 py-8" rounded="lg">
      <VCardText>
        <VBtn
          icon
          variant="outlined"
          color="warning"
          class="mb-4"
          style="block-size: 80px; inline-size: 80px; pointer-events: none;"
        >
          <span class="text-5xl">!</span>
        </VBtn>

        <h3 class="text-h5 mb-2">
          {{ props.title }}
        </h3>
        <p class="text-body-1 text-secondary">
          <slot>{{ props.message }}</slot>
        </p>
      </VCardText>

      <VCardText class="d-flex align-center justify-center gap-3">
        <VBtn
          :color="props.confirmColor"
          variant="elevated"
          :loading="props.loading"
          @click="onConfirm"
        >
          {{ props.confirmText }}
        </VBtn>

        <VBtn
          color="secondary"
          variant="tonal"
          :disabled="props.loading"
          @click="onCancel"
        >
          {{ props.cancelText }}
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>