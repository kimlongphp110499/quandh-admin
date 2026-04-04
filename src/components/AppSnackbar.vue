<script setup lang="ts">
interface Props {
  modelValue: boolean
  message?: string
  color?: string
  timeout?: number
  location?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  message: '',
  color: 'success',
  timeout: 3000,
  location: 'top end',
})

const emit = defineEmits<Emits>()
</script>

<template>
  <VSnackbar
    :model-value="modelValue"
    :color="props.color"
    :location="props.location as any"
    :timeout="props.timeout"
    @update:model-value="emit('update:modelValue', $event)"
  >
    {{ props.message }}
    <template #actions>
      <VBtn
        variant="text"
        @click="emit('update:modelValue', false)"
      >
        Đóng
      </VBtn>
    </template>
  </VSnackbar>
</template>
