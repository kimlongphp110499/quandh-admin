// ── Resolve helpers ───────────────────────────────────────────────

export const resolveMethodColor = (method: string): string =>
  ({
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    PATCH: 'info',
    DELETE: 'error',
  }[method] ?? 'secondary')

export const resolveStatusColor = (code: number): string => {
  if (code >= 500)
    return 'error'
  if (code >= 400)
    return 'warning'
  if (code >= 300)
    return 'info'

  return 'success'
}

// ── Organization map helper ───────────────────────────────────────

export const buildOrganizationMap = (
  items: Array<{ id?: number; organization_id?: number; name?: string; organization_name?: string }>,
): Map<number, string> =>
  new Map(items.map(org => [
    (org.id ?? org.organization_id) as number,
    (org.name ?? org.organization_name) as string,
  ]))

export const resolveOrganizationName = (
  organizationId: number | null,
  map: Map<number, string>,
): string => {
  if (!organizationId)
    return '—'

  return map.get(organizationId) ?? `#${organizationId}`
}

// ── Avatar initials helper ────────────────────────────────────────

export const resolveUserInitials = (userName?: string | null): string =>
  (userName ?? 'G').slice(0, 2).toUpperCase()
