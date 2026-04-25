<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useSettingStore } from '../../stores/useSettingStore'
import AppSnackbar from '@/components/AppSnackbar.vue'

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
    showToast('Cập nhật cấu hình thành công!', 'success')
  }
  catch {
    showToast('Cập nhật cấu hình thất bại!', 'error')
  }
}

const tabs = [
  { icon: 'tabler-adjustments', title: 'Cấu hình chung' },
  { icon: 'tabler-layout-dashboard', title: 'Trang quản trị' },
  { icon: 'tabler-building', title: 'Trang chọn tổ chức' },
  { icon: 'tabler-share', title: 'Mạng xã hội' },
  { icon: 'tabler-api', title: 'Kết nối API' },
  { icon: 'tabler-history', title: 'Cấu hình Nhật ký' },
]

const activeTab = ref(null)

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
    <VRow>
      <!-- Left: Vertical Tabs -->
      <VCol
        cols="12"
        md="4"
      >
        <h5 class="text-h5 mb-4">
          Cài đặt hệ thống
        </h5>

        <VTabs
          v-model="activeTab"
          direction="vertical"
          class="v-tabs-pill disable-tab-transition"
        >
          <VTab
            v-for="(tab, index) in tabs"
            :key="index"
            :prepend-icon="tab.icon"
          >
            {{ tab.title }}
          </VTab>
        </VTabs>
      </VCol>

      <!-- Right: Content -->
      <VCol
        cols="12"
        md="8"
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

        <VWindow
          v-else
          v-model="activeTab"
          class="disable-tab-transition"
          :touch="false"
        >
          <!-- ── Tab 0: Cấu hình chung ─────────────────────────── -->
          <VWindowItem>
            <VCard
              title="Thông tin chung"
              class="mb-6"
            >
              <VCardText>
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
                </VRow>
              </VCardText>
            </VCard>

            <VCard
              title="Favicon"
              class="mb-6"
            >
              <VCardText>
                <div class="d-flex align-center gap-6">
                  <VAvatar
                    rounded
                    size="88"
                    class="flex-shrink-0"
                    :image="general.icon || undefined"
                    variant="tonal"
                    color="secondary"
                  >
                    <VIcon
                      v-if="!general.icon"
                      icon="tabler-photo"
                      size="36"
                    />
                  </VAvatar>
                  <div class="flex-grow-1">
                    <AppTextField
                      v-model="general.icon"
                      label="URL Favicon"
                      placeholder="https://..."
                    />
                    <p class="text-body-2 text-disabled mt-2 mb-0">
                      Định dạng JPG, GIF hoặc PNG. Kích thước tối đa 3MB
                    </p>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <VCard
              title="Logo"
              class="mb-6"
            >
              <VCardText>
                <div class="d-flex align-center gap-6">
                  <VAvatar
                    rounded
                    size="88"
                    class="flex-shrink-0"
                    :image="general.logo || undefined"
                    variant="tonal"
                    color="secondary"
                  >
                    <VIcon
                      v-if="!general.logo"
                      icon="tabler-photo"
                      size="36"
                    />
                  </VAvatar>
                  <div class="flex-grow-1">
                    <AppTextField
                      v-model="general.logo"
                      label="URL Logo"
                      placeholder="https://..."
                    />
                    <p class="text-body-2 text-disabled mt-2 mb-0">
                      Định dạng PNG, JPG. Kích thước tối đa 3MB
                    </p>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <div class="d-flex justify-end gap-x-4">
              <VBtn
                variant="tonal"
                color="secondary"
                @click="populate"
              >
                Hủy
              </VBtn>
              <VBtn
                prepend-icon="tabler-device-floppy"
                :loading="settingStore.isSaving"
                @click="save({ ...general })"
              >
                Lưu thay đổi
              </VBtn>
            </div>
          </VWindowItem>

          <!-- ── Tab 1: Trang quản trị ─────────────────────────── -->
          <VWindowItem>
            <VCard
              title="Trang quản trị"
              class="mb-6"
            >
              <VCardText>
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

            <div class="d-flex justify-end gap-x-4">
              <VBtn
                variant="tonal"
                color="secondary"
                @click="populate"
              >
                Hủy
              </VBtn>
              <VBtn
                prepend-icon="tabler-device-floppy"
                :loading="settingStore.isSaving"
                @click="save({ ...adminPage })"
              >
                Lưu thay đổi
              </VBtn>
            </div>
          </VWindowItem>

          <!-- ── Tab 2: Trang chọn tổ chức ─────────────────────── -->
          <VWindowItem>
            <VCard
              title="Trang chọn tổ chức"
              class="mb-6"
            >
              <VCardText>
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

            <div class="d-flex justify-end gap-x-4">
              <VBtn
                variant="tonal"
                color="secondary"
                @click="populate"
              >
                Hủy
              </VBtn>
              <VBtn
                prepend-icon="tabler-device-floppy"
                :loading="settingStore.isSaving"
                @click="save({ ...orgSelect })"
              >
                Lưu thay đổi
              </VBtn>
            </div>
          </VWindowItem>

          <!-- ── Tab 3: Mạng xã hội ────────────────────────────── -->
          <VWindowItem>
            <VCard
              title="Mạng xã hội"
              class="mb-6"
            >
              <VCardText>
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

            <div class="d-flex justify-end gap-x-4">
              <VBtn
                variant="tonal"
                color="secondary"
                @click="populate"
              >
                Hủy
              </VBtn>
              <VBtn
                prepend-icon="tabler-device-floppy"
                :loading="settingStore.isSaving"
                @click="save({ ...social })"
              >
                Lưu thay đổi
              </VBtn>
            </div>
          </VWindowItem>

          <!-- ── Tab 4: Kết nối API ─────────────────────────────── -->
          <VWindowItem>
            <VCard
              title="Gemini AI"
              class="mb-6"
            >
              <VCardText>
                <VRow>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <AppTextField
                      v-model="api.api_gemini_url"
                      label="API URL"
                      placeholder="https://..."
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <AppTextField
                      v-model="api.api_gemini_token"
                      label="API Token"
                      placeholder="API key"
                      type="password"
                    />
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>

            <VCard
              title="DeepSeek AI"
              class="mb-6"
            >
              <VCardText>
                <VRow>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <AppTextField
                      v-model="api.api_deepseek_url"
                      label="API URL"
                      placeholder="https://..."
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <AppTextField
                      v-model="api.api_deepseek_token"
                      label="API Token"
                      placeholder="API key"
                      type="password"
                    />
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>

            <VCard
              title="ChatGPT"
              class="mb-6"
            >
              <VCardText>
                <VRow>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <AppTextField
                      v-model="api.api_chatgpt_url"
                      label="API URL"
                      placeholder="https://..."
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <AppTextField
                      v-model="api.api_chatgpt_token"
                      label="API Token"
                      placeholder="API key"
                      type="password"
                    />
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>

            <VCard class="mb-6">
              <VCardText>
                <div class="d-flex align-center justify-space-between mb-4">
                  <div>
                    <div class="text-body-1 font-weight-semibold">
                      Firebase
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                      Kết nối Firebase cho thông báo đẩy
                    </div>
                  </div>
                  <VSwitch
                    v-model="api.api_firebase_enabled"
                    label="Kích hoạt"
                    hide-details
                    density="compact"
                  />
                </div>
                <VRow>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <AppTextField
                      v-model="api.api_firebase_url"
                      label="API URL"
                      placeholder="https://..."
                      :disabled="!api.api_firebase_enabled"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <AppTextField
                      v-model="api.api_firebase_token"
                      label="API Token"
                      placeholder="API key"
                      type="password"
                      :disabled="!api.api_firebase_enabled"
                    />
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>

            <VCard
              title="Google Maps"
              class="mb-6"
            >
              <VCardText>
                <VRow>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <AppTextField
                      v-model="api.api_google_maps_url"
                      label="API URL"
                      placeholder="https://..."
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <AppTextField
                      v-model="api.api_google_maps_token"
                      label="API Token"
                      placeholder="API key"
                      type="password"
                    />
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>

            <div class="d-flex justify-end gap-x-4">
              <VBtn
                variant="tonal"
                color="secondary"
                @click="populate"
              >
                Hủy
              </VBtn>
              <VBtn
                prepend-icon="tabler-device-floppy"
                :loading="settingStore.isSaving"
                @click="save({ ...api })"
              >
                Lưu thay đổi
              </VBtn>
            </div>
          </VWindowItem>

          <!-- ── Tab 5: Cấu hình Nhật ký ───────────────────────── -->
          <VWindowItem>
            <VCard
              title="Cấu hình Nhật ký"
              class="mb-6"
            >
              <VCardText>
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

            <div class="d-flex justify-end gap-x-4">
              <VBtn
                variant="tonal"
                color="secondary"
                @click="populate"
              >
                Hủy
              </VBtn>
              <VBtn
                prepend-icon="tabler-device-floppy"
                :loading="settingStore.isSaving"
                @click="save({ ...log })"
              >
                Lưu thay đổi
              </VBtn>
            </div>
          </VWindowItem>
        </VWindow>
      </VCol>
    </VRow>

    <AppSnackbar
      v-model="snackbar.show"
      :message="snackbar.message"
      :color="snackbar.color"
    />
  </div>
</template>
