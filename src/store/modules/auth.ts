import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { authApi } from '@/api/modules'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useCookie } from '@/@core/utils/cookie'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { ability } from '@/plugins/casl/ability'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<any>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const userPermissions = computed(() => user.value?.permissions || [])
  const userRoles = computed(() => user.value?.roles || [])

  // Actions
  async function login(credentials: { email: string; password: string }) {
    try {
      isLoading.value = true
      error.value = null

      const response = await authApi.login(credentials)

      if (response.data.success && response.data.data) {
        token.value = response.data.data.access_token
        user.value = response.data.data.user

        // Lưu vào cookie
        useCookie('accessToken').value = token.value
        useCookie('userData').value = JSON.stringify(user.value)

        // Set CASL ability rules: dùng permissions từ user hoặc rule mặc định
        const permissions = user.value?.permissions ?? []

        const abilityRules = permissions.length > 0
          ? permissions
          : [{ action: 'manage', subject: 'all' }]

        localStorage.setItem('userAbilityRules', JSON.stringify(abilityRules))

        // Update ability instance đang chạy (không cần reload trang)
        ability.update(abilityRules)

        return response.data
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Đăng nhập thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    }
    catch (err) {
      console.error('Logout error:', err)
    }
    finally {
      // Clear state
      token.value = null
      user.value = null
      useCookie('accessToken').value = null
      useCookie('userData').value = null
      localStorage.removeItem('userAbilityRules')
      ability.update([])
    }
  }

  async function fetchUser() {
    try {
      const response = await authApi.me()
      if (response.data.success && response.data.data) {
        user.value = response.data.data
        useCookie('userData').value = JSON.stringify(user.value)
      }
    }
    catch (err) {
      console.error('Fetch user error:', err)
      throw err
    }
  }

  async function switchOrganization(organizationId: number) {
    try {
      isLoading.value = true

      const response = await authApi.switchOrganization(organizationId)

      if (response.data.success) {
        useCookie('organizationId').value = String(organizationId)
        await fetchUser()

        // Reload page để cập nhật permissions
        window.location.reload()
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Chuyển tổ chức thất bại'
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  // Initialize từ cookie khi app khởi động
  function initializeFromCookie() {
    const savedToken = useCookie('accessToken').value
    const savedUser = useCookie('userData').value

    if (savedToken) {
      token.value = savedToken
      if (savedUser) {
        try {
          user.value = JSON.parse(savedUser)
        }
        catch (err) {
          console.error('Parse user data error:', err)
        }
      }
    }
  }

  return {
    // State
    user,
    token,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    userPermissions,
    userRoles,

    // Actions
    login,
    logout,
    fetchUser,
    switchOrganization,
    initializeFromCookie,
  }
})
