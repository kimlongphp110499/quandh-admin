<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAbility } from '@casl/vue'
import { authApi } from '@/api/modules/auth'
import { useCookie } from '@/@core/utils/cookie'
import type { Rule } from '@/plugins/casl/ability'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const router = useRouter()
const route = useRoute()
const ability = useAbility()

const form = ref({
  email: 'admin@example.com',
  password: 'password',
  remember: false,
})

const isPasswordVisible = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const authThemeImg = useGenerateImageVariant(
  authV2LoginIllustrationLight,
  authV2LoginIllustrationDark,
  authV2LoginIllustrationBorderedLight,
  authV2LoginIllustrationBorderedDark,
  true)

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const handleLogin = async () => {
  try {
    errorMessage.value = ''
    isLoading.value = true

    const response = await authApi.login({
      email: form.value.email,
      password: form.value.password,
    })

    if (response.data.success && response.data.data) {
      // Backend trả về access_token, không phải token
      const { access_token } = response.data.data

      // Lưu token vào cookie trước
      useCookie('accessToken').value = access_token
      
      // Sau đó gọi API để lấy thông tin user với permissions
      try {
        const userResponse = await authApi.me()
        
        if (userResponse.data.success && userResponse.data.data) {
          const { user, roles, permissions, abilities } = userResponse.data.data

          // Lưu userData vào cookie
          useCookie('userData').value = user

          // Lưu organizationId (mặc định là 1 nếu không có)
          const organizationId = user.organization_id || user.current_organization_id || '1'
          useCookie('organizationId').value = String(organizationId)
          
          // Lưu abilities vào localStorage (cookie bị truncate do vượt 4KB)
          const userAbilityRules: Rule[] = abilities ?? []
          localStorage.setItem('userAbilityRules', JSON.stringify(userAbilityRules))
          ability.update(userAbilityRules)


          // Redirect to `to` query if exist or redirect to index route
          await nextTick(() => {
            router.replace(route.query.to ? String(route.query.to) : '/')
          })
        }
      } catch (userError) {
        console.error('Failed to fetch user:', userError)
        // Nếu không lấy được user, vẫn redirect về home
        await nextTick(() => {
          router.replace(route.query.to ? String(route.query.to) : '/')
        })
      }
    }
  } catch (error: any) {
    console.error('Login error:', error)
    errorMessage.value = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.'
  } finally {
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
            max-width="613"
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
            Chào mừng đến với <span class="text-capitalize">{{ themeConfig.app.title }}</span>! 👋🏻
          </h4>
          <p class="mb-0">
            Vui lòng đăng nhập để tiếp tục
          </p>
        </VCardText>
        <VCardText>
          <!-- Error Alert -->
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

          <VForm @submit.prevent="handleLogin">
            <VRow>
              <!-- email -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.email"
                  autofocus
                  label="Email"
                  type="email"
                  placeholder="admin@example.com"
                  :disabled="isLoading"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  label="Mật khẩu"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :disabled="isLoading"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <div class="d-flex align-center flex-wrap justify-space-between my-6">
                  <VCheckbox
                    v-model="form.remember"
                    label="Ghi nhớ đăng nhập"
                    :disabled="isLoading"
                  />
                  <a
                    class="text-primary"
                    href="javascript:void(0)"
                  >
                    Quên mật khẩu?
                  </a>
                </div>

                <VBtn
                  block
                  type="submit"
                  :loading="isLoading"
                  :disabled="isLoading"
                >
                  Đăng nhập
                </VBtn>
              </VCol>

              <!-- create account -->
              <VCol
                cols="12"
                class="text-body-1 text-center"
              >
                <span class="d-inline-block">
                  Bạn chưa có tài khoản?
                </span>
                <a
                  class="text-primary ms-1 d-inline-block text-body-1"
                  href="javascript:void(0)"
                >
                  Đăng ký ngay
                </a>
              </VCol>

              <VCol
                cols="12"
                class="d-flex align-center"
              >
                <VDivider />
                <span class="mx-4">or</span>
                <VDivider />
              </VCol>

              <!-- auth providers -->
              <VCol
                cols="12"
                class="text-center"
              >
                <AuthProvider />
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
