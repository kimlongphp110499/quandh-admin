<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useSettingStore } from '@/store/modules/setting'

const settingStore = useSettingStore()

const snackbar = reactive({ show: false, message: '', color: 'success' as 'success' | 'error' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.show = true
  snackbar.message = message
  snackbar.color = color
}

// ── form state per group ─────────────────────────────────────────
const general = reactive({
  copyright: '',
  designed_by: '',
  language: 'vi',
  time_format: 'H:i:s d/m/Y',
  icon: '',
  logo: '',
})

const adminPage = reactive({
  admin_app_name: '',
  admin_logo_title: '',
  admin_welcome_title: '',
  admin_app_description: '',
  admin_background_image: '',
})

const orgSelect = reactive({
  org_select_title: '',
  org_select_description: '',
  org_select_background_image: '',
})

const social = reactive({
  social_facebook: '',
  social_twitter: '',
  social_youtube: '',
  social_tiktok: '',
  social_gmail: '',
  social_email: '',
})

const api = reactive({
  api_gemini_url: '',
  api_gemini_token: '',
  api_deepseek_url: '',
  api_deepseek_token: '',
  api_chatgpt_url: '',
  api_chatgpt_token: '',
  api_firebase_url: '',
  api_firebase_token: '',
  api_firebase_enabled: false,
  api_google_maps_url: '',
  api_google_maps_token: '',
})

const log = reactive({
  log_retention_days: 90,
})

// ── populate from store ──────────────────────────────────────────
function populate() {
  const g = settingStore.settings.general ?? {}

  general.copyright = g.copyright ?? ''
  general.designed_by = g.designed_by ?? ''
  general.language = g.language ?? 'vi'
  general.time_format = g.time_format ?? 'H:i:s d/m/Y'
  general.icon = g.icon ?? ''
  general.logo = g.logo ?? ''

  const ap = settingStore.settings.admin_page ?? {}

  adminPage.admin_app_name = ap.admin_app_name ?? ''
  adminPage.admin_logo_title = ap.admin_logo_title ?? ''
  adminPage.admin_welcome_title = ap.admin_welcome_title ?? ''
  adminPage.admin_app_description = ap.admin_app_description ?? ''
  adminPage.admin_background_image = ap.admin_background_image ?? ''

  const os = settingStore.settings.org_select_page ?? {}

  orgSelect.org_select_title = os.org_select_title ?? ''
  orgSelect.org_select_description = os.org_select_description ?? ''
  orgSelect.org_select_background_image = os.org_select_background_image ?? ''

  const s = settingStore.settings.social ?? {}

  social.social_facebook = s.social_facebook ?? ''
  social.social_twitter = s.social_twitter ?? ''
  social.social_youtube = s.social_youtube ?? ''
  social.social_tiktok = s.social_tiktok ?? ''
  social.social_gmail = s.social_gmail ?? ''
  social.social_email = s.social_email ?? ''

  const a = settingStore.settings.api ?? {}

  api.api_gemini_url = a.api_gemini_url ?? ''
  api.api_gemini_token = a.api_gemini_token ?? ''
  api.api_deepseek_url = a.api_deepseek_url ?? ''
  api.api_deepseek_token = a.api_deepseek_token ?? ''
  api.api_chatgpt_url = a.api_chatgpt_url ?? ''
  api.api_chatgpt_token = a.api_chatgpt_token ?? ''
  api.api_firebase_url = a.api_firebase_url ?? ''
  api.api_firebase_token = a.api_firebase_token ?? ''
  api.api_firebase_enabled = a.api_firebase_enabled ?? false
  api.api_google_maps_url = a.api_google_maps_url ?? ''
  api.api_google_maps_token = a.api_google_maps_token ?? ''

  const l = settingStore.settings.log ?? {}

  log.log_retention_days = l.log_retention_days ?? 90
}

watch(() => settingStore.settings, populate, { deep: true })

onMounted(async () => {
  if (!Object.keys(settingStore.settings).length)
    await settingStore.fetchSettings()
  populate()
})

// ── save helpers ─────────────────────────────────────────────────
async function save(data: Record<string, any>) {
  try {
    await settingStore.updateSettings(data)
    showToast('Lưu cấu hình thành công!', 'success')
  }
  catch {
    showToast('Lưu cấu hình thất bại!', 'error')
  }
}

const tabs = [
  { value: 'general', label: 'Cấu hình chung', icon: 'tabler-adjustments' },
  { value: 'admin_page', label: 'Trang quản trị', icon: 'tabler-layout-dashboard' },
  { value: 'org_select', label: 'Trang chọn tổ chức', icon: 'tabler-building' },
  { value: 'social', label: 'Mạng xã hội', icon: 'tabler-share' },
  { value: 'api', label: 'Kết nối API ngoài', icon: 'tabler-api' },
  { value: 'log', label: 'Cấu hình Nhật ký', icon: 'tabler-history' },
]

const activeTab = ref('general')

const languageOptions = [
  { title: 'Tiếng Việt', value: 'vi' },
  { title: 'English', value: 'en' },
]

const timeFormatOptions = [
  { title: '24h (HH:MM:SS DD/MM/YYYY)', value: 'H:i:s d/m/Y' },
  { title: '24h (HH:MM DD/MM/YYYY)', value: 'H:i d/m/Y' },
  { title: '12h (hh:MM AM/PM)', value: 'h:i A d/m/Y' },
]
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h4 class="text-h4 font-weight-bold">
          Cấu hình hệ thống
        </h4>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Quản lý cấu hình chung của hệ thống
        </p>
      </div>
    </div>

    <VRow>
      <!-- Left nav tabs -->
      <VCol
        cols="12"
        md="3"
      >
        <VCard
          elevation="0"
          border
        >
          <VList
            nav
            density="compact"
          >
            <VListItem
              v-for="tab in tabs"
              :key="tab.value"
              :value="tab.value"
              :prepend-icon="tab.icon"
              :title="tab.label"
              :active="activeTab === tab.value"
              color="primary"
              rounded="lg"
              class="mb-1"
              @click="activeTab = tab.value"
            />
          </VList>
        </VCard>
      </VCol>

      <!-- Right content -->
      <VCol
        cols="12"
        md="9"
      >
        <!-- Loading -->
        <div
          v-if="settingStore.isLoading"
          class="d-flex justify-center align-center py-16"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>

        <!-- Cấu hình chung -->
        <VCard
          v-else-if="activeTab === 'general'"
          elevation="0"
          border
        >
          <VCardText class="d-flex align-center gap-3 pa-5 border-b">
            <VIcon
              icon="tabler-adjustments"
              color="primary"
              size="20"
            />
            <div class="flex-grow-1">
              <div class="text-body-1 font-weight-semibold">
                Cấu hình chung
              </div>
              <div class="text-caption text-medium-emphasis">
                Thông tin chung của hệ thống
              </div>
            </div>
            <VBtn
              prepend-icon="tabler-device-floppy"
              :loading="settingStore.isSaving"
              @click="save({ ...general })"
            >
              Lưu
            </VBtn>
          </VCardText>

          <VCardText class="pa-5">
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="general.copyright"
                  label="Bản quyền"
                  placeholder="© 2026 Sở Nội vụ thành phố Đà Nẵng"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="general.designed_by"
                  label="Thiết kế bởi"
                  placeholder="Danatec"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  v-model="general.language"
                  label="Ngôn ngữ"
                  :items="languageOptions"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  v-model="general.time_format"
                  label="Định dạng thời gian"
                  :items="timeFormatOptions"
                />
              </VCol>

              <!-- Favicon -->
              <VCol cols="12">
                <div class="text-body-2 font-weight-medium mb-3">
                  Biểu tượng trang (Favicon)
                </div>
                <div class="d-flex align-center gap-4">
                  <div
                    class="setting-img-preview rounded"
                    style="width:64px;height:64px;"
                  >
                    <VImg
                      v-if="general.icon"
                      :src="general.icon"
                      width="64"
                      height="64"
                      cover
                      class="rounded"
                    />
                    <div
                      v-else
                      class="d-flex align-center justify-center w-100 h-100 bg-surface-variant rounded"
                    >
                      <VIcon
                        icon="tabler-photo"
                        size="32"
                        color="disabled"
                      />
                    </div>
                  </div>
                  <div>
                    <AppTextField
                      v-model="general.icon"
                      label="URL favicon"
                      placeholder="https://..."
                      density="compact"
                      style="min-inline-size: 300px"
                    />
                    <div class="text-caption text-disabled mt-1">
                      Định dạng JPG, GIF hoặc PNG. Kích thước tối đa 3MB
                    </div>
                  </div>
                </div>
              </VCol>

              <!-- Logo -->
              <VCol cols="12">
                <div class="text-body-2 font-weight-medium mb-3">
                  Logo
                </div>
                <div class="d-flex align-center gap-4">
                  <div
                    class="setting-img-preview rounded"
                    style="width:80px;height:80px;"
                  >
                    <VImg
                      v-if="general.logo"
                      :src="general.logo"
                      width="80"
                      height="80"
                      cover
                      class="rounded"
                    />
                    <div
                      v-else
                      class="d-flex align-center justify-center w-100 h-100 bg-surface-variant rounded"
                    >
                      <VIcon
                        icon="tabler-photo"
                        size="32"
                        color="disabled"
                      />
                    </div>
                  </div>
                  <div>
                    <AppTextField
                      v-model="general.logo"
                      label="URL logo"
                      placeholder="https://..."
                      density="compact"
                      style="min-inline-size: 300px"
                    />
                    <div class="text-caption text-disabled mt-1">
                      Định dạng PNG, JPG. Kích thước tối đa 3MB
                    </div>
                  </div>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Trang quản trị -->
        <VCard
          v-else-if="activeTab === 'admin_page'"
          elevation="0"
          border
        >
          <VCardText class="d-flex align-center gap-3 pa-5 border-b">
            <VIcon
              icon="tabler-layout-dashboard"
              color="primary"
              size="20"
            />
            <div class="flex-grow-1">
              <div class="text-body-1 font-weight-semibold">
                Trang quản trị
              </div>
              <div class="text-caption text-medium-emphasis">
                Tùy chỉnh giao diện trang quản trị
              </div>
            </div>
            <VBtn
              prepend-icon="tabler-device-floppy"
              :loading="settingStore.isSaving"
              @click="save({ ...adminPage })"
            >
              Lưu
            </VBtn>
          </VCardText>

          <VCardText class="pa-5">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="adminPage.admin_app_name"
                  label="Tên ứng dụng"
                  placeholder="QuânDH Core"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="adminPage.admin_logo_title"
                  label="Tiêu đề logo"
                  placeholder="Hệ thống quản trị"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="adminPage.admin_welcome_title"
                  label="Tiêu đề chào mừng"
                  placeholder="Chào mừng đến với hệ thống"
                />
              </VCol>
              <VCol cols="12">
                <AppTextarea
                  v-model="adminPage.admin_app_description"
                  label="Mô tả ứng dụng"
                  placeholder="Mô tả ngắn về ứng dụng"
                  rows="3"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="adminPage.admin_background_image"
                  label="URL ảnh nền"
                  placeholder="https://..."
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Trang chọn tổ chức -->
        <VCard
          v-else-if="activeTab === 'org_select'"
          elevation="0"
          border
        >
          <VCardText class="d-flex align-center gap-3 pa-5 border-b">
            <VIcon
              icon="tabler-building"
              color="primary"
              size="20"
            />
            <div class="flex-grow-1">
              <div class="text-body-1 font-weight-semibold">
                Trang chọn tổ chức
              </div>
              <div class="text-caption text-medium-emphasis">
                Tùy chỉnh trang chọn tổ chức sau khi đăng nhập
              </div>
            </div>
            <VBtn
              prepend-icon="tabler-device-floppy"
              :loading="settingStore.isSaving"
              @click="save({ ...orgSelect })"
            >
              Lưu
            </VBtn>
          </VCardText>

          <VCardText class="pa-5">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="orgSelect.org_select_title"
                  label="Tiêu đề trang"
                  placeholder="Chọn tổ chức"
                />
              </VCol>
              <VCol cols="12">
                <AppTextarea
                  v-model="orgSelect.org_select_description"
                  label="Mô tả"
                  placeholder="Mô tả ngắn hiển thị trên trang chọn tổ chức"
                  rows="3"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="orgSelect.org_select_background_image"
                  label="URL ảnh nền"
                  placeholder="https://..."
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Mạng xã hội -->
        <VCard
          v-else-if="activeTab === 'social'"
          elevation="0"
          border
        >
          <VCardText class="d-flex align-center gap-3 pa-5 border-b">
            <VIcon
              icon="tabler-share"
              color="primary"
              size="20"
            />
            <div class="flex-grow-1">
              <div class="text-body-1 font-weight-semibold">
                Mạng xã hội
              </div>
              <div class="text-caption text-medium-emphasis">
                Liên kết mạng xã hội hiển thị trên hệ thống
              </div>
            </div>
            <VBtn
              prepend-icon="tabler-device-floppy"
              :loading="settingStore.isSaving"
              @click="save({ ...social })"
            >
              Lưu
            </VBtn>
          </VCardText>

          <VCardText class="pa-5">
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="social.social_facebook"
                  label="Facebook"
                  placeholder="https://facebook.com/..."
                  prepend-inner-icon="tabler-brand-facebook"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="social.social_twitter"
                  label="Twitter / X"
                  placeholder="https://twitter.com/..."
                  prepend-inner-icon="tabler-brand-twitter"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="social.social_youtube"
                  label="YouTube"
                  placeholder="https://youtube.com/..."
                  prepend-inner-icon="tabler-brand-youtube"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="social.social_tiktok"
                  label="TikTok"
                  placeholder="https://tiktok.com/..."
                  prepend-inner-icon="tabler-brand-tiktok"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="social.social_gmail"
                  label="Gmail"
                  placeholder="contact@gmail.com"
                  prepend-inner-icon="tabler-brand-google"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="social.social_email"
                  label="Email liên hệ"
                  placeholder="contact@example.com"
                  prepend-inner-icon="tabler-mail"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Kết nối API ngoài -->
        <VCard
          v-else-if="activeTab === 'api'"
          elevation="0"
          border
        >
          <VCardText class="d-flex align-center gap-3 pa-5 border-b">
            <VIcon
              icon="tabler-api"
              color="primary"
              size="20"
            />
            <div class="flex-grow-1">
              <div class="text-body-1 font-weight-semibold">
                Kết nối API ngoài
              </div>
              <div class="text-caption text-medium-emphasis">
                Cấu hình kết nối với các dịch vụ API bên ngoài
              </div>
            </div>
            <VBtn
              prepend-icon="tabler-device-floppy"
              :loading="settingStore.isSaving"
              @click="save({ ...api })"
            >
              Lưu
            </VBtn>
          </VCardText>

          <VCardText class="pa-5">
            <div class="text-body-2 font-weight-semibold mb-3">
              Gemini AI
            </div>
            <VRow class="mb-4">
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="api.api_gemini_url"
                  label="Gemini API URL"
                  placeholder="https://..."
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="api.api_gemini_token"
                  label="Gemini Token"
                  placeholder="API key"
                  type="password"
                />
              </VCol>
            </VRow>

            <VDivider class="mb-4" />
            <div class="text-body-2 font-weight-semibold mb-3">
              DeepSeek AI
            </div>
            <VRow class="mb-4">
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="api.api_deepseek_url"
                  label="DeepSeek API URL"
                  placeholder="https://..."
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="api.api_deepseek_token"
                  label="DeepSeek Token"
                  placeholder="API key"
                  type="password"
                />
              </VCol>
            </VRow>

            <VDivider class="mb-4" />
            <div class="text-body-2 font-weight-semibold mb-3">
              ChatGPT
            </div>
            <VRow class="mb-4">
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="api.api_chatgpt_url"
                  label="ChatGPT API URL"
                  placeholder="https://..."
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="api.api_chatgpt_token"
                  label="ChatGPT Token"
                  placeholder="API key"
                  type="password"
                />
              </VCol>
            </VRow>

            <VDivider class="mb-4" />
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-body-2 font-weight-semibold">
                Firebase
              </div>
              <VSwitch
                v-model="api.api_firebase_enabled"
                label="Kích hoạt"
                hide-details
                density="compact"
              />
            </div>
            <VRow class="mb-4">
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="api.api_firebase_url"
                  label="Firebase API URL"
                  placeholder="https://..."
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="api.api_firebase_token"
                  label="Firebase Token"
                  placeholder="API key"
                  type="password"
                />
              </VCol>
            </VRow>

            <VDivider class="mb-4" />
            <div class="text-body-2 font-weight-semibold mb-3">
              Google Maps
            </div>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="api.api_google_maps_url"
                  label="Google Maps API URL"
                  placeholder="https://..."
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="api.api_google_maps_token"
                  label="Google Maps Token"
                  placeholder="API key"
                  type="password"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Cấu hình Nhật ký -->
        <VCard
          v-else-if="activeTab === 'log'"
          elevation="0"
          border
        >
          <VCardText class="d-flex align-center gap-3 pa-5 border-b">
            <VIcon
              icon="tabler-history"
              color="primary"
              size="20"
            />
            <div class="flex-grow-1">
              <div class="text-body-1 font-weight-semibold">
                Cấu hình Nhật ký
              </div>
              <div class="text-caption text-medium-emphasis">
                Quản lý cài đặt lưu trữ nhật ký hoạt động
              </div>
            </div>
            <VBtn
              prepend-icon="tabler-device-floppy"
              :loading="settingStore.isSaving"
              @click="save({ ...log })"
            >
              Lưu
            </VBtn>
          </VCardText>

          <VCardText class="pa-5">
            <VRow>
              <VCol
                cols="12"
                md="4"
              >
                <AppTextField
                  v-model.number="log.log_retention_days"
                  label="Số ngày giữ nhật ký"
                  type="number"
                  placeholder="90"
                  suffix="ngày"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="top end"
      :timeout="3000"
    >
      {{ snackbar.message }}
      <template #actions>
        <VBtn
          variant="text"
          @click="snackbar.show = false"
        >
          Đóng
        </VBtn>
      </template>
    </VSnackbar>
  </div>
</template>

<style scoped>
.setting-img-preview {
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
