<!-- eslint-disable import/no-unresolved -->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAbility } from '@casl/vue'

// eslint-disable-next-line import/extensions
import { useAuthStore } from '@/store/modules/auth'

// eslint-disable-next-line import/extensions
import { useSettingStore } from '@/store/modules/setting'

// eslint-disable-next-line import/extensions
import { type Rule } from '@/plugins/casl/ability'
// eslint-disable-next-line import/extensions, import/no-unresolved
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import AppSwitchOrgDialog from '@/components/AppSwitchOrgDialog.vue'

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
const settingStore = useSettingStore()

const form = ref({
  login: '',
  password: '',
  remember: false,
})

const isPasswordVisible = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})

function clearErrors() {
  errorMessage.value = ''
  fieldErrors.value = {}
}

// Dialog chọn tổ chức
const isOrgDialogOpen = ref(false)
const selectedOrgId = ref<number | null>(null)
const orgDialogError = ref('')

// ─── Settings computed ───────────────────────────────────────────
const adminSettings = computed(() => settingStore.settings.admin_page ?? {})
const generalSettings = computed(() => settingStore.settings.general ?? {})
const socialSettings = computed(() => settingStore.settings.social ?? {})
const orgSelectPage = computed(() => settingStore.settings.org_select_page ?? {})

const appName = computed(() => adminSettings.value.admin_logo_title || adminSettings.value.admin_app_name || 'Hệ thống quản trị')
const welcomeTitle = computed(() => adminSettings.value.admin_welcome_title || appName.value)
const appDescription = computed(() => adminSettings.value.admin_app_description || '')
const backgroundImage = computed(() => adminSettings.value.admin_background_image || '')
const logoUrl = computed(() => generalSettings.value.logo || '')
const orgSelectTitle = computed(() => orgSelectPage.value.org_select_title || '')
const orgSelectDescription = computed(() => orgSelectPage.value.org_select_description || '')

const faviconUrl = computed(() => generalSettings.value.icon || '')

const socialLinks = computed(() => {
  const s = socialSettings.value

  return [
    s.social_facebook ? { icon: 'tabler-brand-facebook', url: s.social_facebook, color: '#1877F2' } : null,
    s.social_twitter ? { icon: 'tabler-brand-twitter', url: s.social_twitter, color: '#1DA1F2' } : null,
    s.social_youtube ? { icon: 'tabler-brand-youtube', url: s.social_youtube, color: '#FF0000' } : null,
    s.social_tiktok ? { icon: 'tabler-brand-tiktok', url: s.social_tiktok, color: '#000000' } : null,
    s.social_gmail ? { icon: 'tabler-brand-google', url: `mailto:${s.social_gmail}`, color: '#EA4335' } : null,
    s.social_email ? { icon: 'tabler-mail', url: `mailto:${s.social_email}`, color: '#6366F1' } : null,
  ].filter(Boolean)
})

// ─── Handlers ───────────────────────────────────────────────────
const handleLogin = async () => {
  try {
    clearErrors()
    isLoading.value = true

    await authStore.login({
      email: form.value.login,
      password: form.value.password,
    })

    if (authStore.needsOrgSelection) {
      selectedOrgId.value = null
      orgDialogError.value = ''
      isOrgDialogOpen.value = true
    }
    else {
      await nextTick(() => {
        router.replace(route.query.to ? String(route.query.to) : '/dashboard')
      })
    }
  }
  catch (error: any) {
    const data = error.response?.data
    if (data?.errors) {
      const errs: Record<string, string> = {}
      for (const [key, messages] of Object.entries(data.errors as Record<string, string[]>))
        errs[key] = messages[0]
      fieldErrors.value = errs
    }
    else {
      errorMessage.value = data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
    }
  }
  finally {
    isLoading.value = false
  }
}

const handleSelectOrg = async (orgId: number) => {
  try {
    orgDialogError.value = ''
    isLoading.value = true

    await authStore.switchOrganization(orgId)

    const savedRules = localStorage.getItem('userAbilityRules')

    if (savedRules) {
      const rules: Rule[] = JSON.parse(savedRules)

      ability.update(rules)
    }

    isOrgDialogOpen.value = false

    await nextTick(() => {
      router.replace(route.query.to ? String(route.query.to) : '/dashboard')
    })
  }
  catch (error: any) {
    orgDialogError.value = error.response?.data?.message || 'Chọn tổ chức thất bại. Vui lòng thử lại.'
  }
  finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (!Object.keys(settingStore.settings).length)
    await settingStore.fetchPublicSettings()
})
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
          <!-- Logo + Tên -->
          <div class="d-flex align-center gap-3 mb-3">
            <VAvatar
              v-if="logoUrl"
              size="48"
              rounded
            >
              <VImg
                :src="logoUrl"
                :alt="appName"
              />
            </VAvatar>

            <VAvatar
              v-else
              size="48"
              color="primary"
              variant="tonal"
              rounded
            >
              <VIcon
                icon="tabler-building-community"
                size="26"
              />
            </VAvatar>

            <h5 class="text-h5 font-weight-bold text-uppercase mb-0">
              {{ appName }}
            </h5>
          </div>

          <h4 class="text-h4 mb-1">
            {{ welcomeTitle || 'Đăng nhập' }}
          </h4>

          <p
            v-if="appDescription"
            class="mb-0"
          >
            {{ appDescription }}
          </p>
        </VCardText>

        <VCardText>
          <!-- Error alert -->
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

          <!-- Form -->
          <VForm @submit.prevent="handleLogin">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="form.login"
                  autofocus
                  label="Email hoặc tên đăng nhập"
                  placeholder="Nhập thông tin đăng nhập"
                  :disabled="isLoading"
                  :error-messages="fieldErrors.email"
                  @input="delete fieldErrors.email"
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
                  :error-messages="fieldErrors.password"
                  @input="delete fieldErrors.password"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>

              <VCol cols="12">
                <div class="d-flex align-center justify-space-between mb-4">
                  <VCheckbox
                    v-model="form.remember"
                    label="Ghi nhớ đăng nhập"
                    :disabled="isLoading"
                    hide-details
                  />
                  <RouterLink
                    class="text-primary text-body-2"
                    to="/forgot-password"
                  >
                    Quên mật khẩu?
                  </RouterLink>
                </div>

                <VBtn
                  block
                  type="submit"
                  size="large"
                  :loading="isLoading"
                >
                  Đăng Nhập
                </VBtn>
              </VCol>
            </VRow>
          </VForm>

          <VCol
            cols="12"
            md="12"
            class="d-flex align-center"
          >
            <VDivider class="my-12" />
            <span class="mx-4 text-no-wrap">Theo dõi chúng tôi</span>
            <VDivider />
          </VCol>

          <!-- Social links -->
          <template v-if="socialLinks.length">

            <AuthProvider :links="socialLinks as any" />
          </template>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Dialog chọn tổ chức -->
  <AppSwitchOrgDialog
    v-model="isOrgDialogOpen"
    :loading="isLoading"
    :error="orgDialogError"
    logout-on-close
    @confirm="handleSelectOrg"
    @close="authStore.logout().then(() => router.replace('/login'))"
  />
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
