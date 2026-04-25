import type { TaskAssignmentDepartment } from '@/api/modules/task-assignment-department'

// ── Resolve helpers ───────────────────────────────────────────────

export type DepartmentStatus = TaskAssignmentDepartment['status']

export const resolveDepartmentStatusLabel = (status: DepartmentStatus): string =>
  status === 'active' ? 'Hoạt động' : 'Không hoạt động'

export const resolveDepartmentStatusColor = (status: DepartmentStatus): string =>
  status === 'active' ? 'success' : 'secondary'

export const resolveToggleStatusLabel = (status: DepartmentStatus): string =>
  status === 'active' ? 'Tắt hoạt động' : 'Bật hoạt động'

export const resolveToggleStatusIcon = (status: DepartmentStatus): string =>
  status === 'active' ? 'tabler-toggle-right' : 'tabler-toggle-left'

export const toggleDepartmentStatus = (status: DepartmentStatus): DepartmentStatus =>
  status === 'active' ? 'inactive' : 'active'
