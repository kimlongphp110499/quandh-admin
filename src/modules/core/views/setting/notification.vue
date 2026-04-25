<!-- eslint-disable import/extensions -->
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

const activeTab = ref(null)
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
    showToast('Cập nhật cấu hình thành công!', 'success')
  }
  catch {
    showToast('Cập nhật cấu hình thất bại!', 'error')
  }
}

async function testEmail() {
  isTestingEmail.value = true
  try {
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
  { icon: 'tabler-mail', title: 'Cấu hình Email' },
  { icon: 'tabler-message', title: 'Cấu hình SMS' },
  { icon: 'tabler-brand-telegram', title: 'Cấu hình Zalo' },
  { icon: 'tabler-messages', title: 'Chat nội bộ' },
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
    <VRow>
      <!-- Left: Vertical Tabs -->
      <VCol
        cols="12"
        md="4"
      >
        <h5 class="text-h5 mb-4">
          Cài đặt thông báo
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
          <!-- ── Tab 0: Email ───────────────────────────────────── -->
          <VWindowItem>
            <VCard
              title="Cấu hình Email"
              class="mb-6"
            >
              <VCardText>
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
                </VRow>
              </VCardText>
            </VCard>

            <VCard
              title="Email kiểm thử"
              class="mb-6"
            >
              <VCardText>
                <VRow>
                  <VCol cols="12">
                    <AppTextField
                      v-model="email.email_test_address"
                      label="Địa chỉ email kiểm thử"
                      placeholder="test@gmail.com"
                      type="email"
                    />
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>

            <div class="d-flex justify-end gap-x-4">
              <VBtn
                variant="tonal"
                color="secondary"
                prepend-icon="tabler-send"
                :loading="isTestingEmail"
                @click="testEmail"
              >
                Gửi email kiểm thử
              </VBtn>
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
                @click="save({ ...email })"
              >
                Lưu thay đổi
              </VBtn>
            </div>
          </VWindowItem>

          <!-- ── Tab 1: SMS ─────────────────────────────────────── -->
          <VWindowItem>
            <VCard
              title="Cấu hình SMS"
              class="mb-6"
            >
              <VCardText>
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
                @click="save({ ...sms })"
              >
                Lưu thay đổi
              </VBtn>
            </div>
          </VWindowItem>

          <!-- ── Tab 2: Zalo ────────────────────────────────────── -->
          <VWindowItem>
            <VCard
              title="Cấu hình Zalo"
              class="mb-6"
            >
              <VCardText>
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
                @click="save({ ...zalo })"
              >
                Lưu thay đổi
              </VBtn>
            </div>
          </VWindowItem>

          <!-- ── Tab 3: Chat nội bộ ─────────────────────────────── -->
          <VWindowItem>
            <VCard
              title="Chat nội bộ"
              class="mb-6"
            >
              <VCardText>
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
                @click="save({ ...chat })"
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
