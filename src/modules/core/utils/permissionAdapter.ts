import type { Permission } from '../services/permissionApi'
import type { Role } from '@/api/modules/role'

// ── Tree helpers ──────────────────────────────────────────────────

export const flattenPermissionIds = (nodes: Permission[]): number[] =>
  nodes.flatMap(node => [node.id, ...flattenPermissionIds(node.children ?? [])])

export const filterPermissionTree = (nodes: Permission[], query: string): Permission[] => {
  const q = query.toLowerCase().trim()
  if (!q)
    return nodes

  return nodes.reduce<Permission[]>((acc, node) => {
    const childMatches = filterPermissionTree(node.children ?? [], q)

    const selfMatches
      = node.name.toLowerCase().includes(q)
      || (node.description ?? '').toLowerCase().includes(q)

    if (selfMatches || childMatches.length > 0) {
      acc.push({
        ...node,
        children: childMatches.length > 0 ? childMatches : (selfMatches ? (node.children ?? []) : []),
      })
    }

    return acc
  }, [])
}

// ── Role name extraction from Role.permissions ───────────────────

export const extractRolePermissionNames = (role: Role): string[] => {
  const rolePermissions = role.permissions as unknown
  if (!Array.isArray(rolePermissions))
    return []

  return rolePermissions
    .map(permission => {
      if (typeof permission === 'string')
        return permission
      if (permission && typeof permission === 'object' && 'name' in permission) {
        const name = (permission as { name?: unknown }).name

        return typeof name === 'string' ? name : ''
      }

      return ''
    })
    .filter(Boolean)
}

// ── Hydrate: merge created_at + roles into permission tree nodes ──

export interface PermissionExtraData {
  createdAtByPermissionId: Record<number, string>
  rolesByPermissionId: Record<number, { id: number; name: string }[]>
}

export const buildPermissionExtraData = (
  permissions: Permission[],
  roles: Role[],
): PermissionExtraData => {
  const createdAtMap: Record<number, string> = {}
  const permissionNameToIds = new Map<string, number[]>()
  const roleMapByPermissionId = new Map<number, Map<number, { id: number; name: string }>>()

  const addRoleForPermission = (permissionId: number, role: { id: number; name: string }) => {
    const roleMap = roleMapByPermissionId.get(permissionId) ?? new Map<number, { id: number; name: string }>()

    roleMap.set(role.id, role)
    roleMapByPermissionId.set(permissionId, roleMap)
  }

  permissions.forEach(permission => {
    if (permission.created_at)
      createdAtMap[permission.id] = permission.created_at

    const key = permission.name.trim().toLowerCase()
    const ids = permissionNameToIds.get(key) ?? []

    ids.push(permission.id)
    permissionNameToIds.set(key, ids)
    ;(permission.roles ?? []).forEach(role => addRoleForPermission(permission.id, role))
  })

  roles.forEach(role => {
    extractRolePermissionNames(role).forEach(permissionName => {
      const ids = permissionNameToIds.get(permissionName.trim().toLowerCase()) ?? []

      ids.forEach(permissionId => addRoleForPermission(permissionId, { id: role.id, name: role.name }))
    })
  })

  const rolesByPermissionId: Record<number, { id: number; name: string }[]> = {}

  roleMapByPermissionId.forEach((roleMap, permissionId) => {
    rolesByPermissionId[permissionId] = Array.from(roleMap.values())
  })

  return { createdAtByPermissionId: createdAtMap, rolesByPermissionId }
}

// ── Enrich tree with extra data ───────────────────────────────────

export const enrichPermissionTree = (
  nodes: Permission[],
  extraData: PermissionExtraData,
): Permission[] =>
  nodes.map(node => ({
    ...node,
    children: node.children ? enrichPermissionTree(node.children, extraData) : node.children,
    created_at: extraData.createdAtByPermissionId[node.id] ?? node.created_at,
    roles: extraData.rolesByPermissionId[node.id] ?? node.roles,
  }))
