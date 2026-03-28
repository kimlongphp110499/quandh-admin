<!-- eslint-disable import/no-unresolved -->
<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAbility } from '@casl/vue'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useAuthStore } from '@/store/modules/auth'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { type Rule } from '@/plugins/casl/ability'

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const router = useRouter()
const route = useRoute()
const ability = useAbility()
const authStore = useAuthStore()

// Bước hiện tại: 'login' | 'select-org'
const step = ref<'login' | 'select-org'>('login')

const form = ref({
  email: '',
  password: '',
  remember: false,
})

const isPasswordVisible = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const selectedOrgId = ref<number | null>(null)

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

    await authStore.login({
      email: form.value.email,
      password: form.value.password,
    })

    // Nếu cần chọn tổ chức → hiện bước chọn org
    if (authStore.needsOrgSelection) {
      step.value = 'select-org'
    }
    else {
      await nextTick(() => {
        router.replace(route.query.to ? String(route.query.to) : '/')
      })
    }
  }
  catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.'
  }
  finally {
    isLoading.value = false
  }
}

const handleSelectOrg = async () => {
  if (!selectedOrgId.value)
    return

  try {
    errorMessage.value = ''
    isLoading.value = true

    await authStore.switchOrganization(selectedOrgId.value)

    // Sau switch org, cập nhật CASL từ store (đã được update trong switchOrganization)
    const savedRules = localStorage.getItem('userAbilityRules')

    if (savedRules) {
      const rules: Rule[] = JSON.parse(savedRules)

      ability.update(rules)
    }

    await nextTick(() => {
      router.replace(route.query.to ? String(route.query.to) : '/')
    })
  }
  catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Chọn tổ chức thất bại. Vui lòng thử lại.'
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
        <!-- BƯỚC 1: ĐĂNG NHẬP -->
        <template v-if="step === 'login'">
          <VCardText>
            <h4 class="text-h4 mb-1">
              Chào mừng đến với <span class="text-capitalize">{{ themeConfig.app.title }}</span>! 👋🏻
            </h4>
            <p class="mb-0">
              Vui lòng đăng nhập để tiếp tục
            </p>
          </VCardText>

          <VCardText>
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

                <VCol cols="12">
                  <AppTextField
                    v-model="form.password"
                    label="Mật khẩu"
                    placeholder="············"
                    :type="isPasswordVisible ? 'text' : 'password'"
                    autocomplete="current-password"
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
                    <RouterLink
                      class="text-primary"
                      to="/forgot-password"
                    >
                      Quên mật khẩu?
                    </RouterLink>
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
              </VRow>
            </VForm>
          </VCardText>
        </template>

        <!-- BƯỚC 2: CHỌN TỔ CHỨC -->
        <template v-else-if="step === 'select-org'">
          <VCardText>
            <h4 class="text-h4 mb-1">
              Chọn tổ chức làm việc 🏢
            </h4>
            <p class="mb-0">
              Tài khoản của bạn thuộc nhiều tổ chức. Vui lòng chọn tổ chức để tiếp tục.
            </p>
          </VCardText>

          <VCardText>
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

            <VRow>
              <!-- Danh sách tổ chức -->
              <VCol cols="12">
                <div class="d-flex flex-column gap-3">
                  <VCard
                    v-for="org in authStore.availableOrganizations"
                    :key="org.id"
                    :variant="selectedOrgId === org.id ? 'tonal' : 'outlined'"
                    :color="selectedOrgId === org.id ? 'primary' : undefined"
                    class="cursor-pointer pa-1"
                    @click="selectedOrgId = org.id"
                  >
                    <VCardText class="d-flex align-center gap-3 py-3">
                      <VAvatar
                        color="primary"
                        variant="tonal"
                        size="40"
                      >
                        <VIcon icon="tabler-building" />
                      </VAvatar>
                      <div>
                        <div class="font-weight-semibold">
                          {{ org.name }}
                        </div>
                      </div>
                      <VSpacer />
                      <VIcon
                        v-if="selectedOrgId === org.id"
                        icon="tabler-circle-check-filled"
                        color="primary"
                      />
                    </VCardText>
                  </VCard>
                </div>
              </VCol>

              <VCol cols="12">
                <VBtn
                  block
                  :loading="isLoading"
                  :disabled="isLoading || !selectedOrgId"
                  @click="handleSelectOrg"
                >
                  Vào hệ thống
                </VBtn>
              </VCol>

              <VCol
                cols="12"
                class="text-center"
              >
                <a
                  class="text-primary d-inline-flex align-center gap-1"
                  href="javascript:void(0)"
                  @click="step = 'login'; errorMessage = ''"
                >
                  <VIcon
                    icon="tabler-arrow-left"
                    size="16"
                  />
                  Quay lại
                </a>
              </VCol>
            </VRow>
          </VCardText>
        </template>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
