import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { authApi } from '@/api/modules'

import { useCookie } from '@/@core/utils/cookie'

import { type Rule, ability } from '@/plugins/casl/ability'

export interface Organization {
  id: number
  name: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<any>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const availableOrganizations = ref<Organization[]>([])
  const currentOrganizationId = ref<number | null>(null)
  const currentOrganizationName = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const userPermissions = computed(() => user.value?.permissions || [])
  const userRoles = computed(() => user.value?.roles || [])

  // Cần chọn tổ chức khi chưa có org hiện tại và có ít nhất 1 org để chọn
  const needsOrgSelection = computed(
    () => !currentOrganizationId.value && availableOrganizations.value.length > 0,
  )

  const currentOrganization = computed(
    () => availableOrganizations.value.find(o => o.id === currentOrganizationId.value) ?? null,
  )

  const currentOrganizationDisplayName = computed(
    () => currentOrganizationName.value ?? currentOrganization.value?.name ?? null,
  )

  // Actions
  async function login(credentials: { email: string; password: string }) {
    try {
      isLoading.value = true
      error.value = null

      const response = await authApi.login(credentials)

      if (response.data.success && response.data.data) {
        const data = response.data.data as any
        const accessToken = data.access_token
        const orgId = data.current_organization_id ?? null
        const orgs: Organization[] = data.available_organizations ?? []
        const abilities: Rule[] = data.abilities ?? []

        // Gộp roles/permissions từ top-level vào user object
        const userData = {
          ...data.user,
          roles: data.roles ?? data.user?.roles ?? [],
          permissions: data.permissions ?? data.user?.permissions ?? [],
        }

        token.value = accessToken
        user.value = userData
        availableOrganizations.value = orgs
        currentOrganizationId.value = orgId

        const orgName = orgs.find((o: Organization) => o.id === orgId)?.name ?? null

        currentOrganizationName.value = orgName

        useCookie('accessToken').value = accessToken
        useCookie('userData').value = userData
        localStorage.setItem('availableOrganizations', JSON.stringify(orgs))
        if (orgName)
          localStorage.setItem('currentOrganizationName', orgName)

        if (orgId) {
          useCookie('organizationId').value = String(orgId)

          // Chỉ lưu abilities khi đã có org (có đủ permissions context)
          const abilityRules: Rule[] = abilities.length > 0
            ? abilities
            : [{ action: 'manage', subject: 'all' }]

          localStorage.setItem('userAbilityRules', JSON.stringify(abilityRules))
          ability.update(abilityRules)
        }

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
      token.value = null
      user.value = null
      availableOrganizations.value = []
      currentOrganizationId.value = null
      currentOrganizationName.value = null
      useCookie('accessToken').value = null
      useCookie('userData').value = null
      useCookie('organizationId').value = null
      localStorage.removeItem('userAbilityRules')
      localStorage.removeItem('availableOrganizations')
      localStorage.removeItem('currentOrganizationName')
      ability.update([])
    }
  }

  async function fetchUser() {
    try {
      const response = await authApi.me()

      if (response.data.success && response.data.data) {
        const data = response.data.data as any
        const abilities: Rule[] = data.abilities ?? []
        const orgId = data.current_organization_id ?? null

        // Gộp roles/permissions từ top-level vào user object
        const userData = {
          ...data.user,
          roles: data.roles ?? data.user?.roles ?? [],
          permissions: data.permissions ?? data.user?.permissions ?? [],
        }

        user.value = userData
        currentOrganizationId.value = orgId
        useCookie('userData').value = userData

        if (orgId)
          useCookie('organizationId').value = String(orgId)

        // Cập nhật danh sách tổ chức nếu API trả về dữ liệu (không ghi đè khi trả về mảng rỗng)
        if (Array.isArray(data.available_organizations) && data.available_organizations.length > 0) {
          availableOrganizations.value = data.available_organizations
          localStorage.setItem('availableOrganizations', JSON.stringify(data.available_organizations))
        }

        // Cập nhật tên tổ chức hiện tại (ưu tiên dữ liệu từ API, fallback sang danh sách)
        const orgNameFromData = data.current_organization?.name ?? data.organization?.name ?? null
        const orgNameFromList = availableOrganizations.value.find(o => o.id === orgId)?.name ?? null
        const resolvedOrgName = orgNameFromData ?? orgNameFromList ?? null
        if (resolvedOrgName) {
          currentOrganizationName.value = resolvedOrgName
          localStorage.setItem('currentOrganizationName', resolvedOrgName)
        }

        if (abilities.length) {
          localStorage.setItem('userAbilityRules', JSON.stringify(abilities))
          ability.update(abilities)
        }
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

      if (response.data.success && response.data.data) {
        const data = response.data.data as any
        const orgId = data.current_organization_id || organizationId
        const abilities: Rule[] = data.abilities ?? []

        currentOrganizationId.value = orgId
        useCookie('organizationId').value = String(orgId)

        // Cập nhật tên tổ chức sau khi switch
        const switchedOrgName = availableOrganizations.value.find(o => o.id === orgId)?.name
          ?? data.current_organization?.name
          ?? data.organization?.name
          ?? null

        if (switchedOrgName) {
          currentOrganizationName.value = switchedOrgName
          localStorage.setItem('currentOrganizationName', switchedOrgName)
        }

        // Cập nhật roles & permissions của user theo tổ chức mới
        if (user.value) {
          user.value = {
            ...user.value,
            roles: data.roles ?? user.value.roles ?? [],
            permissions: data.permissions ?? user.value.permissions ?? [],
          }
          useCookie('userData').value = user.value
        }

        if (abilities.length) {
          const abilityRules: Rule[] = abilities

          localStorage.setItem('userAbilityRules', JSON.stringify(abilityRules))
          ability.update(abilityRules)
        }
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
    const savedOrgId = useCookie('organizationId').value

    if (savedToken) {
      token.value = savedToken as string

      if (savedUser)
        user.value = savedUser

      if (savedOrgId)
        currentOrganizationId.value = Number(savedOrgId)

      const savedOrgs = localStorage.getItem('availableOrganizations')

      if (savedOrgs) {
        try {
          availableOrganizations.value = JSON.parse(savedOrgs)
        }
        catch {}
      }

      const savedOrgName = localStorage.getItem('currentOrganizationName')
      if (savedOrgName)
        currentOrganizationName.value = savedOrgName
    }
  }

  return {
    user,
    token,
    isLoading,
    error,
    availableOrganizations,
    currentOrganizationId,
    currentOrganizationName,
    isAuthenticated,
    userPermissions,
    userRoles,
    needsOrgSelection,
    currentOrganization,
    currentOrganizationDisplayName,
    login,
    logout,
    fetchUser,
    switchOrganization,
    initializeFromCookie,
  }
})
