import type { Role } from '../services/roleApi'

// ── ViewModel ────────────────────────────────────────────────────────

export interface RoleViewModel {
  id: number
  name: string
  guardName: string
  organizationId: number | null
  organizationName: string
  permissions: string[]
  usersCount: number
  createdAt: string
  updatedAt: string
}

// ── Adapter: API → ViewModel ─────────────────────────────────────────

export const mapRoleToViewModel = (role: Role): RoleViewModel => ({
  id: role.id,
  name: role.name,
  guardName: role.guard_name ?? 'web',
  organizationId: role.organization_id ?? null,
  organizationName: role.organization?.name ?? '',
  permissions: role.permissions ?? [],
  usersCount: role.users_count ?? 0,
  createdAt: role.created_at,
  updatedAt: role.updated_at,
})

// ── Adapter: table sort key → API sort field ─────────────────────────

export const mapRoleSortField = (key: string): string =>
  ({
    name: 'name',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }[key] ?? 'created_at')
