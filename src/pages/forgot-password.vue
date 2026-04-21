<!-- eslint-disable import/no-unresolved -->
<script setup lang="ts">
import { ref } from 'vue'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2ForgotPasswordIllustrationDark from '@images/pages/auth-v2-forgot-password-illustration-dark.png'
import authV2ForgotPasswordIllustrationLight from '@images/pages/auth-v2-forgot-password-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { authApi } from '@/api/modules/auth'

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const email = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const authThemeImg = useGenerateImageVariant(
  authV2ForgotPasswordIllustrationLight,
  authV2ForgotPasswordIllustrationDark,
)

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const handleForgotPassword = async () => {
  try {
    errorMessage.value = ''
    successMessage.value = ''
    isLoading.value = true

    const response = await authApi.forgotPassword(email.value)

    if (response.data.success)
      successMessage.value = response.data.message || 'Link đặt lại mật khẩu đã được gửi vào Email của bạn.'
  }
  catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Không thể gửi email. Vui lòng kiểm tra lại địa chỉ email.'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <VRow
    no-gutters
    class="auth-wrapper bg-surface justify-center"
  >
    <VCol
      cols="12"
      md="6"
      class="auth-card-v2 d-flex align-center justify-center"
    >
      <VCard
        flat
        :max-width="600"
        class="mt-12 mt-sm-0 pa-6"
      >
        <VCardText>
          <h4 class="text-h4 mb-1">
            Quên mật khẩu?
          </h4>
        </VCardText>

        <VCardText>
          <VAlert
            v-if="successMessage"
            type="success"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="successMessage = ''"
          >
            {{ successMessage }}
          </VAlert>

          <VAlert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </VAlert>

          <VForm @submit.prevent="handleForgotPassword">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="email"
                  autofocus
                  label="Email"
                  type="email"
                  placeholder="admin@example.com"
                  :disabled="isLoading || !!successMessage"
                />
              </VCol>

              <VCol cols="12">
                <VBtn
                  block
                  type="submit"
                  :loading="isLoading"
                  :disabled="isLoading || !!successMessage"
                >
                  Gửi link đặt lại mật khẩu
                </VBtn>
              </VCol>

              <VCol
                cols="12"
                class="text-center"
              >
                <RouterLink
                  class="text-primary d-inline-flex align-center gap-1"
                  to="/login"
                >
                  <VIcon
                    icon="tabler-arrow-left"
                    size="16"
                  />
                  Quay lại đăng nhập
                </RouterLink>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
