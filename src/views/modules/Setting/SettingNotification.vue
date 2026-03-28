<!-- eslint-disable import/extensions -->
<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
// eslint-disable-next-line import/no-unresolved
import { useSettingStore } from '@/store/modules/setting'

const settingStore = useSettingStore()

const snackbar = reactive({ show: false, message: '', color: 'success' as 'success' | 'error' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.show = true
  snackbar.message = message
  snackbar.color = color
}

const activeTab = ref('email')
const isTestingEmail = ref(false)
const emailPasswordVisible = ref(false)
const smsPasswordVisible = ref(false)
const zaloPasswordVisible = ref(false)
const chatApiKeyVisible = ref(false)

// ── Email ────────────────────────────────────────────────────────
const email = reactive({
  email_protocol: 'smtp',
  email_sender_name: '',
  email_sender_address: '',
  email_smtp_host: '',
  email_smtp_username: '',
  email_smtp_password: '',
  email_smtp_port: '587',
  email_smtp_encryption: 'tls',
  email_test_address: '',
})

// ── SMS ─────────────────────────────────────────────────────────
const sms = reactive({
  sms_server: '',
  sms_username: '',
  sms_password: '',
  sms_test_phone: '',
})

// ── Zalo ────────────────────────────────────────────────────────
const zalo = reactive({
  zalo_server: '',
  zalo_username: '',
  zalo_password: '',
  zalo_sender: '',
  zalo_template_id: '',
})

// ── Chat ────────────────────────────────────────────────────────
const chat = reactive({
  chat_server: '',
  chat_api_key: '',
  chat_sender: '',
  chat_receiver: '',
  chat_room: '',
  chat_department: '',
  chat_email_title: '',
})

function populate() {
  const e = settingStore.settings.email ?? {}

  email.email_protocol = e.email_protocol ?? 'smtp'
  email.email_sender_name = e.email_sender_name ?? ''
  email.email_sender_address = e.email_sender_address ?? ''
  email.email_smtp_host = e.email_smtp_host ?? ''
  email.email_smtp_username = e.email_smtp_username ?? ''
  email.email_smtp_password = e.email_smtp_password ?? ''
  email.email_smtp_port = e.email_smtp_port ?? '587'
  email.email_smtp_encryption = e.email_smtp_encryption ?? 'tls'
  email.email_test_address = e.email_test_address ?? ''

  const s = settingStore.settings.sms ?? {}

  sms.sms_server = s.sms_server ?? ''
  sms.sms_username = s.sms_username ?? ''
  sms.sms_password = s.sms_password ?? ''
  sms.sms_test_phone = s.sms_test_phone ?? ''

  const z = settingStore.settings.zalo ?? {}

  zalo.zalo_server = z.zalo_server ?? ''
  zalo.zalo_username = z.zalo_username ?? ''
  zalo.zalo_password = z.zalo_password ?? ''
  zalo.zalo_sender = z.zalo_sender ?? ''
  zalo.zalo_template_id = z.zalo_template_id ?? ''

  const c = settingStore.settings.chat ?? {}

  chat.chat_server = c.chat_server ?? ''
  chat.chat_api_key = c.chat_api_key ?? ''
  chat.chat_sender = c.chat_sender ?? ''
  chat.chat_receiver = c.chat_receiver ?? ''
  chat.chat_room = c.chat_room ?? ''
  chat.chat_department = c.chat_department ?? ''
  chat.chat_email_title = c.chat_email_title ?? ''
}

watch(() => settingStore.settings, populate, { deep: true })

onMounted(async () => {
  if (!Object.keys(settingStore.settings).length)
    await settingStore.fetchSettings()
  populate()
})

async function save(data: Record<string, any>) {
  try {
    await settingStore.updateSettings(data)
    showToast('Lưu cấu hình thành công!', 'success')
  }
  catch {
    showToast('Lưu cấu hình thất bại!', 'error')
  }
}

async function testEmail() {
  isTestingEmail.value = true
  try {
    // Save current email settings first, then trigger test
    await settingStore.updateSettings({ ...email })
    showToast('Gửi email kiểm thử thành công!', 'success')
  }
  catch {
    showToast('Gửi email kiểm thử thất bại!', 'error')
  }
  finally {
    isTestingEmail.value = false
  }
}

const tabs = [
  { value: 'email', label: 'Cấu hình Email', icon: 'tabler-mail' },
  { value: 'sms', label: 'Cấu hình SMS', icon: 'tabler-message' },
  { value: 'zalo', label: 'Cấu hình Zalo', icon: 'tabler-brand-telegram' },
  { value: 'chat', label: 'Cấu hình chat nội bộ', icon: 'tabler-messages' },
]

const protocolOptions = [
  { title: 'SMTP', value: 'smtp' },
  { title: 'Sendmail', value: 'sendmail' },
  { title: 'Mail', value: 'mail' },
]

const encryptionOptions = [
  { title: 'TLS', value: 'tls' },
  { title: 'SSL', value: 'ssl' },
  { title: 'Không', value: 'none' },
]
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h4 class="text-h4 font-weight-bold">
          Cấu hình thông báo
        </h4>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Quản lý cấu hình các kênh gửi thông báo
        </p>
      </div>
    </div>

    <VRow>
      <!-- Left nav -->
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
        <div
          v-if="settingStore.isLoading"
          class="d-flex justify-center align-center py-16"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>

        <!-- Email -->
        <VCard
          v-else-if="activeTab === 'email'"
          elevation="0"
          border
        >
          <VCardText class="d-flex align-center gap-3 pa-5 border-b">
            <VIcon
              icon="tabler-mail"
              color="primary"
              size="20"
            />
            <div class="flex-grow-1">
              <div class="text-body-1 font-weight-semibold">
                Cấu hình Email
              </div>
              <div class="text-caption text-medium-emphasis">
                Cấu hình thông tin máy chủ email
              </div>
            </div>
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="tabler-send"
              :loading="isTestingEmail"
              class="me-2"
              @click="testEmail"
            >
              Kiểm Thử Email
            </VBtn>
            <VBtn
              prepend-icon="tabler-device-floppy"
              :loading="settingStore.isSaving"
              @click="save({ ...email })"
            >
              Cập Nhật
            </VBtn>
          </VCardText>

          <VCardText class="pa-5">
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  v-model="email.email_protocol"
                  label="Giao thức Email"
                  :items="protocolOptions"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="email.email_sender_name"
                  label="Tên người gửi"
                  placeholder="Sở Nội vụ thành phố Đà Nẵng"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="email.email_sender_address"
                  label="Địa chỉ email gửi"
                  placeholder="pmis@danang.gov.vn"
                  type="email"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="email.email_smtp_host"
                  label="Máy chủ SMTP"
                  placeholder="mail.danang.gov.vn"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="email.email_smtp_username"
                  label="Tài khoản SMTP"
                  placeholder="pmis@danang.gov.vn"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="email.email_smtp_password"
                  label="Mật khẩu SMTP"
                  placeholder="••••••"
                  :type="emailPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="emailPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="emailPasswordVisible = !emailPasswordVisible"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="email.email_smtp_port"
                  label="Cổng SMTP"
                  placeholder="587"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  v-model="email.email_smtp_encryption"
                  label="Loại bảo mật"
                  :items="encryptionOptions"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="email.email_test_address"
                  label="Email kiểm thử"
                  placeholder="test@gmail.com"
                  type="email"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- SMS -->
        <VCard
          v-else-if="activeTab === 'sms'"
          elevation="0"
          border
        >
          <VCardText class="d-flex align-center gap-3 pa-5 border-b">
            <VIcon
              icon="tabler-message"
              color="primary"
              size="20"
            />
            <div class="flex-grow-1">
              <div class="text-body-1 font-weight-semibold">
                Cấu hình SMS
              </div>
              <div class="text-caption text-medium-emphasis">
                Cấu hình dịch vụ gửi tin nhắn SMS
              </div>
            </div>
            <VBtn
              prepend-icon="tabler-device-floppy"
              :loading="settingStore.isSaving"
              @click="save({ ...sms })"
            >
              Cập Nhật
            </VBtn>
          </VCardText>

          <VCardText class="pa-5">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="sms.sms_server"
                  label="Máy chủ SMS"
                  placeholder="https://..."
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="sms.sms_username"
                  label="Tên đăng nhập"
                  placeholder="username"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="sms.sms_password"
                  label="Mật khẩu"
                  placeholder="••••••"
                  :type="smsPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="smsPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="smsPasswordVisible = !smsPasswordVisible"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="sms.sms_test_phone"
                  label="Số điện thoại kiểm thử"
                  placeholder="0901234567"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Zalo -->
        <VCard
          v-else-if="activeTab === 'zalo'"
          elevation="0"
          border
        >
          <VCardText class="d-flex align-center gap-3 pa-5 border-b">
            <VIcon
              icon="tabler-brand-telegram"
              color="primary"
              size="20"
            />
            <div class="flex-grow-1">
              <div class="text-body-1 font-weight-semibold">
                Cấu hình Zalo
              </div>
              <div class="text-caption text-medium-emphasis">
                Cấu hình dịch vụ gửi thông báo qua Zalo OA
              </div>
            </div>
            <VBtn
              prepend-icon="tabler-device-floppy"
              :loading="settingStore.isSaving"
              @click="save({ ...zalo })"
            >
              Cập Nhật
            </VBtn>
          </VCardText>

          <VCardText class="pa-5">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="zalo.zalo_server"
                  label="Máy chủ Zalo"
                  placeholder="https://..."
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="zalo.zalo_username"
                  label="Tên đăng nhập"
                  placeholder="username"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="zalo.zalo_password"
                  label="Mật khẩu"
                  placeholder="••••••"
                  :type="zaloPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="zaloPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="zaloPasswordVisible = !zaloPasswordVisible"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="zalo.zalo_sender"
                  label="Người gửi (OA ID)"
                  placeholder="OA ID"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="zalo.zalo_template_id"
                  label="Mẫu tin nhắn ID"
                  placeholder="Template ID"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Chat nội bộ -->
        <VCard
          v-else-if="activeTab === 'chat'"
          elevation="0"
          border
        >
          <VCardText class="d-flex align-center gap-3 pa-5 border-b">
            <VIcon
              icon="tabler-messages"
              color="primary"
              size="20"
            />
            <div class="flex-grow-1">
              <div class="text-body-1 font-weight-semibold">
                Cấu hình chat nội bộ
              </div>
              <div class="text-caption text-medium-emphasis">
                Cấu hình kết nối hệ thống chat nội bộ
              </div>
            </div>
            <VBtn
              prepend-icon="tabler-device-floppy"
              :loading="settingStore.isSaving"
              @click="save({ ...chat })"
            >
              Cập Nhật
            </VBtn>
          </VCardText>

          <VCardText class="pa-5">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="chat.chat_server"
                  label="Máy chủ Chat"
                  placeholder="https://..."
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="chat.chat_api_key"
                  label="API Key"
                  placeholder="API key"
                  :type="chatApiKeyVisible ? 'text' : 'password'"
                  :append-inner-icon="chatApiKeyVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="chatApiKeyVisible = !chatApiKeyVisible"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="chat.chat_sender"
                  label="Người gửi"
                  placeholder="Tên người gửi"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="chat.chat_receiver"
                  label="Người nhận"
                  placeholder="Tên người nhận"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="chat.chat_room"
                  label="Phòng chat"
                  placeholder="Room ID"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="chat.chat_department"
                  label="Phòng ban"
                  placeholder="Department ID"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="chat.chat_email_title"
                  label="Tiêu đề mail"
                  placeholder="Tiêu đề thông báo qua email"
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
