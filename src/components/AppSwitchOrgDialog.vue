<!-- eslint-disable import/extensions, import/no-unresolved -->
<script setup lang="ts">
import { useAuthStore } from '@/store/modules/auth'

interface Props {
  modelValue: boolean
  loading?: boolean
  error?: string

  /** Nếu true: nút đóng là "Đăng xuất", ngược lại là "Đóng" */
  logoutOnClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: '',
  logoutOnClose: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'confirm', orgId: number): void
  (e: 'close'): void
}>()

const authStore = useAuthStore()

const selectedOrgId = ref<number | null>(null)

watch(() => props.modelValue, open => {
  if (open)
    selectedOrgId.value = authStore.currentOrganizationId ?? null
})

function handleConfirm() {
  if (selectedOrgId.value)
    emit('confirm', selectedOrgId.value)
}

function handleClose() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="480"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <DialogCloseBtn @click="handleClose" />

    <VCard class="pa-sm-10 pa-4">
      <VCardText class="text-center pb-2">
        <h4 class="text-h4 mb-2">
          Đổi tổ chức
        </h4>
      </VCardText>

      <VCardText>
        <VAlert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
        >
          {{ error }}
        </VAlert>

        <div class="d-flex flex-column gap-2 mt-4">
          <VCard
            v-for="org in authStore.availableOrganizations"
            :key="org.id"
            :variant="selectedOrgId === org.id ? 'tonal' : 'outlined'"
            :color="selectedOrgId === org.id ? 'primary' : undefined"
            class="cursor-pointer"
            @click="selectedOrgId = org.id"
          >
            <VCardText class="d-flex align-center gap-3 py-3">
              <VAvatar
                color="primary"
                variant="tonal"
                size="36"
                rounded
              >
                <VIcon
                  icon="tabler-building"
                  size="18"
                />
              </VAvatar>
              <span class="font-weight-medium">{{ org.name }}</span>
              <VSpacer />
              <VIcon
                v-if="selectedOrgId === org.id"
                icon="tabler-circle-check-filled"
                color="primary"
                size="20"
              />
            </VCardText>
          </VCard>
        </div>

        <div class="d-flex flex-column gap-3 mt-6">
          <VBtn
            block
            size="large"
            :loading="loading"
            :disabled="loading || !selectedOrgId || selectedOrgId === authStore.currentOrganizationId"
            @click="handleConfirm"
          >
            Vào hệ thống
          </VBtn>
          <VBtn
            v-if="logoutOnClose"
            block
            variant="tonal"
            color="secondary"
            :disabled="loading"
            prepend-icon="tabler-logout"
            @click="handleClose"
          >
            Đăng xuất
          </VBtn>
          <VBtn
            v-else
            block
            variant="tonal"
            color="secondary"
            :disabled="loading"
            @click="handleClose"
          >
            Đóng
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>
