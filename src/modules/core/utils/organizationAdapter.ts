import type { OrganizationStatus } from '../services/organizationApi'
import { ORG_STATUS_OPTIONS } from '../configs/organizationOptions'

export { ORG_STATUS_OPTIONS }

export const resolveOrgStatusColor = (status: OrganizationStatus): string =>
  ORG_STATUS_OPTIONS.find(o => o.value === status)?.color ?? 'secondary'

export const resolveOrgStatusLabel = (status: OrganizationStatus): string =>
  ORG_STATUS_OPTIONS.find(o => o.value === status)?.title ?? status
