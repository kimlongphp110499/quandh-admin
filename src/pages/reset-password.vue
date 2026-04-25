<!-- eslint-disable import/no-unresolved -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2ResetPasswordIllustrationDark from '@images/pages/auth-v2-reset-password-illustration-dark.png'
import authV2ResetPasswordIllustrationLight from '@images/pages/auth-v2-reset-password-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

import { authApi } from '@/api/modules/auth'

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const route = useRoute()
const router = useRouter()

const form = ref({
  password: '',
  passwordConfirmation: '',
})

const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Token và email lấy từ query params trong link email gửi về
const token = route.query.token as string
const email = route.query.email as string

const authThemeImg = useGenerateImageVariant(
  authV2ResetPasswordIllustrationLight,
  authV2ResetPasswordIllustrationDark,
)

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const handleResetPassword = async () => {
  if (!token || !email) {
    errorMessage.value = 'Link đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu lại.'

    return
  }

  if (form.value.password !== form.value.passwordConfirmation) {
    errorMessage.value = 'Mật khẩu xác nhận không khớp.'

    return
  }

  try {
    errorMessage.value = ''
    successMessage.value = ''
    isLoading.value = true

    const response = await authApi.resetPassword({
      token,
      email,
      password: form.value.password,
      password_confirmation: form.value.passwordConfirmation,
    })

    if (response.data.success) {
      successMessage.value = response.data.message || 'Mật khẩu đã được đặt lại thành công.'
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }
  catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.'
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
            Đặt lại mật khẩu
          </h4>
          <p class="mb-0">
            Mật khẩu mới phải khác với mật khẩu đã sử dụng trước đây
          </p>
        </VCardText>

        <VCardText>
          <!-- Cảnh báo khi thiếu token/email -->
          <VAlert
            v-if="!token || !email"
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
            <RouterLink
              to="/forgot-password"
              class="text-primary ms-1"
            >
              Yêu cầu lại
            </RouterLink>
          </VAlert>

          <VAlert
            v-if="successMessage"
            type="success"
            variant="tonal"
            class="mb-4"
          >
            {{ successMessage }}
            <div class="text-caption mt-1">
              Đang chuyển hướng về trang đăng nhập...
            </div>
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

          <VForm
            v-if="!successMessage"
            @submit.prevent="handleResetPassword"
          >
            <VRow>
              <!-- Mật khẩu mới -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  autofocus
                  label="Mật khẩu mới"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="new-password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :disabled="isLoading || !token || !email"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>

              <!-- Xác nhận mật khẩu -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.passwordConfirmation"
                  label="Xác nhận mật khẩu"
                  placeholder="············"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  autocomplete="new-password"
                  :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :disabled="isLoading || !token || !email"
                  @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                />
              </VCol>

              <VCol cols="12">
                <VBtn
                  block
                  type="submit"
                  :loading="isLoading"
                  :disabled="isLoading || !token || !email"
                >
                  Đặt lại mật khẩu
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
