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

const props = withDefaults(defineProps<Props>(), {
  title: 'Xác nhận',
  message: '',
  confirmText: 'Xác nhận',
  cancelText: 'Hủy',
  confirmColor: 'error',
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
    :model-value="modelValue"
    max-width="400"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard rounded="lg">
      <VCardTitle class="pt-6 px-6">
        {{ props.title }}
      </VCardTitle>
      <VCardText class="px-6">
        <slot>{{ props.message }}</slot>
      </VCardText>
      <VCardActions class="px-6 pb-6">
        <VSpacer />
        <VBtn
          :color="props.confirmColor"
          :loading="props.loading"
          @click="onConfirm"
        >
          {{ props.confirmText }}
        </VBtn>
        <VBtn
          variant="tonal"
          color="secondary"
          :disabled="props.loading"
          @click="onCancel"
        >
          {{ props.cancelText }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
