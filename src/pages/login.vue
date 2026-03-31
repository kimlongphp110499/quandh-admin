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

// Dialog chọn tổ chức
const isOrgDialogOpen = ref(false)
const selectedOrgId = ref<number | null>(null)
const orgDialogError = ref('')

// ─── Settings computed ───────────────────────────────────────────
const adminSettings = computed(() => settingStore.settings.admin_page ?? {})
const generalSettings = computed(() => settingStore.settings.general ?? {})
const socialSettings = computed(() => settingStore.settings.social ?? {})

const appName = computed(() => adminSettings.value.admin_logo_title || adminSettings.value.admin_app_name || 'Hệ thống quản trị')
const welcomeTitle = computed(() => adminSettings.value.admin_welcome_title || appName.value)
const appDescription = computed(() => adminSettings.value.admin_app_description || '')
const backgroundImage = computed(() => adminSettings.value.admin_background_image || '')
const logoUrl = computed(() => generalSettings.value.logo || '')
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
    errorMessage.value = ''
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
    errorMessage.value = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
  }
  finally {
    isLoading.value = false
  }
}

const handleSelectOrg = async () => {
  if (!selectedOrgId.value)
    return

  try {
    orgDialogError.value = ''
    isLoading.value = true

    await authStore.switchOrganization(selectedOrgId.value)

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
  <!-- Fullscreen background -->
  <div class="login-page-wrapper">
    <!-- Background image -->
    <div
      class="login-bg"
      :style="backgroundImage ? `background-image: url('${backgroundImage}')` : ''"
    />

    <!-- Overlay tối nhẹ -->
    <div class="login-overlay" />

    <!-- Card trung tâm -->
    <div class="login-card-wrapper">
      <VCard
        class="login-card pa-6 pa-sm-8"
        elevation="8"
        rounded="lg"
        max-width="420"
        width="100%"
      >
        <!-- Logo + Tên -->
        <div class="d-flex flex-column align-center mb-6">
          <VAvatar
            v-if="logoUrl"
            size="64"
            class="mb-3"
            rounded
          >
            <VImg
              :src="logoUrl"
              :alt="appName"
            />
          </VAvatar>
          <VAvatar
            v-else
            size="64"
            color="primary"
            variant="tonal"
            class="mb-3"
            rounded
          >
            <VIcon
              icon="tabler-building-community"
              size="36"
            />
          </VAvatar>

          <h5 class="text-h5 font-weight-bold text-center text-uppercase">
            {{ appName }}
          </h5>
          <p
            v-if="welcomeTitle"
            class="text-body-1 font-weight-medium text-center mt-1 mb-0"
          >
            {{ welcomeTitle }}
          </p>
          <p
            v-if="appDescription"
            class="text-body-2 text-medium-emphasis text-center mt-1 mb-0"
          >
            {{ appDescription }}
          </p>
        </div>

        <!-- Error alert -->
        <VAlert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          density="compact"
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
                label="Nhập tên đăng nhập hoặc email"
                placeholder="Nhập thông tin đăng nhập"
                prepend-inner-icon="tabler-user"
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
            </VCol>

            <VCol cols="12">
              <div class="d-flex align-center justify-space-between mb-4">
                <VCheckbox
                  v-model="form.remember"
                  label="Ghi nhớ đăng nhập"
                  :disabled="isLoading"
                  hide-details
                  density="compact"
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

        <!-- Social links -->
        <template v-if="socialLinks.length">
          <VDivider class="my-4">
            <span class="text-caption text-medium-emphasis px-2">Theo dõi chúng tôi</span>
          </VDivider>

          <div class="d-flex justify-center gap-3">
            <a
              v-for="(link, i) in socialLinks"
              :key="i"
              :href="link!.url"
              target="_blank"
              rel="noopener"
              class="social-icon-link"
            >
              <VIcon
                :icon="link!.icon"
                size="22"
                :color="link!.color"
              />
            </a>
          </div>
        </template>
      </VCard>
    </div>
  </div>

  <!-- Dialog chọn tổ chức -->
  <VDialog
    v-model="isOrgDialogOpen"
    max-width="480"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center gap-3 pt-6 px-6">
        <VAvatar
          color="primary"
          variant="tonal"
          size="40"
          rounded
        >
          <VIcon icon="tabler-building" />
        </VAvatar>
        <div>
          <div class="text-h6">
            Chọn tổ chức làm việc
          </div>
          <div class="text-body-2 text-medium-emphasis font-weight-regular">
            Tài khoản của bạn thuộc nhiều tổ chức
          </div>
        </div>
      </VCardTitle>

      <VDivider class="mt-4" />

      <VCardText class="px-6 pt-4">
        <VAlert
          v-if="orgDialogError"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="orgDialogError = ''"
        >
          {{ orgDialogError }}
        </VAlert>

        <div class="d-flex flex-column gap-2">
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
      </VCardText>

      <VCardActions class="px-6 pb-6 pt-2">
        <VBtn
          block
          size="large"
          :loading="isLoading"
          :disabled="isLoading || !selectedOrgId"
          @click="handleSelectOrg"
        >
          Vào hệ thống
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style lang="scss" scoped>
.login-page-wrapper {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-bg {
  position: absolute;
  inset: 0;
  background-color: #1a2540;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.login-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
}

.login-card-wrapper {
  position: relative;
  z-index: 1;
  inline-size: 100%;
  max-inline-size: 420px;
  padding-inline: 1rem;
}

.login-card {
  backdrop-filter: blur(4px);
}

.social-icon-link {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.85;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}
</style>
