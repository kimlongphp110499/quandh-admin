import type { User, UserStatus } from '../services/userApi'

// ── Resolve helpers ───────────────────────────────────────────────

export const resolveUserStatusColor = (status: UserStatus): string => ({
  active: 'success',
  inactive: 'secondary',
}[status] ?? 'secondary')

export const resolveUserStatusLabel = (status: UserStatus): string => ({
  active: 'Hoạt động',
  inactive: 'Không hoạt động',
}[status] ?? status)

export const USER_STATUS_OPTIONS = [
  { title: 'Hoạt động', value: 'active' },
  { title: 'Không hoạt động', value: 'inactive' },
] as const

// ── Adapter: API → ViewModel ──────────────────────────────────────

export interface UserViewModel {
  id: number
  name: string
  email: string
  userName: string
  status: UserStatus
  roles: string[]
  organizations: string[]
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export const mapUserToViewModel = (user: User): UserViewModel => {
  const assignments = user.assignments ?? []
  const roles = [...new Set(assignments.map(a => a.role_name).filter(Boolean))] as string[]

  const organizations = [...new Set(
    assignments.flatMap(a => a.organizations?.map(o => o.name).filter(Boolean) ?? []),
  )] as string[]

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    userName: user.user_name,
    status: user.status,
    roles,
    organizations,
    createdBy: user.created_by ?? '',
    updatedBy: user.updated_by ?? '',
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }
}

// ── Adapter: form sort key → API sort field ───────────────────────

export const mapUserSortField = (key: string): string => ({
  name: 'name',
  email: 'email',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}[key] ?? 'created_at')
