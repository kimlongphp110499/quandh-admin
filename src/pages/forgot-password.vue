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
  <a href="javascript:void(0)">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">
        {{ themeConfig.app.title }}
      </h1>
    </div>
  </a>

  <VRow
    no-gutters
    class="auth-wrapper bg-surface"
  >
    <VCol
      md="8"
      class="d-none d-md-flex"
    >
      <div class="position-relative bg-background w-100 me-0">
        <div
          class="d-flex align-center justify-center w-100 h-100"
          style="padding-inline: 6.25rem;"
        >
          <VImg
            max-width="500"
            :src="authThemeImg"
            class="auth-illustration mt-16 mb-2"
          />
        </div>
        <img
          class="auth-footer-mask flip-in-rtl"
          :src="authThemeMask"
          alt="auth-footer-mask"
          height="280"
          width="100"
        >
      </div>
    </VCol>

    <VCol
      cols="12"
      md="4"
      class="auth-card-v2 d-flex align-center justify-center"
    >
      <VCard
        flat
        :max-width="500"
        class="mt-12 mt-sm-0 pa-6"
      >
        <VCardText>
          <h4 class="text-h4 mb-1">
            Quên mật khẩu? 🔒
          </h4>
          <p class="mb-0">
            Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
          </p>
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
