export default [
  {
    title: 'Quản lý hệ thống',
    icon: { icon: 'tabler-calendar-event' },
    children: [
      {
        title: 'Tổng quan',
        to: { name: 'dashboard' },
        icon: { icon: 'tabler-layout-dashboard' },
        action: 'index',
        subject: 'Dashboard',
      },
      {
        title: 'Tổ chức',
        to: { name: 'system-organizations' },
        icon: { icon: 'tabler-building' },
        action: 'index',
        subject: 'Organizations',
      },
      {
        title: 'Người dùng',
        to: { name: 'system-users' },
        icon: { icon: 'tabler-users' },
        action: 'index',
        subject: 'Users',
      },
      {
        title: 'Nhật ký hoạt động',
        to: { name: 'system-activity-logs' },
        icon: { icon: 'tabler-history' },
        action: 'index',
        subject: 'LogActivities',
      },
      {
        title: 'Vai trò & Quyền hạn',
        icon: { icon: 'tabler-lock' },
        children: [
          {
            title: 'Vai trò',
            to: { name: 'system-roles' },
            icon: { icon: 'tabler-shield-half' },
            action: 'index',
            subject: 'Roles',
          },
          {
            title: 'Quyền hạn',
            to: { name: 'system-permissions' },
            icon: { icon: 'tabler-key' },
            action: 'index',
            subject: 'Permissions',
          },
        ],
      },
      {
        title: 'Cấu hình hệ thống',
        icon: { icon: 'tabler-settings' },
        children: [
          {
            title: 'Cấu hình chung',
            to: { name: 'system-settings' },
            icon: { icon: 'tabler-adjustments' },
            action: 'index',
            subject: 'Settings',
          },
          {
            title: 'Cấu hình thông báo',
            to: { name: 'system-settings-notification' },
            icon: { icon: 'tabler-bell' },
            action: 'index',
            subject: 'Settings',
          },
        ],
      },
    ],
  },
  {
    title: 'Phân công công việc',
    icon: { icon: 'tabler-checklist' },
    children: [
      {
        title: 'Tổng quan',
        to: { name: 'task-assignment-dashboard' },
        icon: { icon: 'tabler-layout-dashboard' },
        action: 'index',
        subject: 'Dashboard',
      },
      {
        title: 'Công việc của tôi',
        to: { name: 'task-assignment-my-tasks' },
        icon: { icon: 'tabler-user-check' },
        action: 'index',
        subject: 'TaskAssignmentMyTasks',
      },
      {
        title: 'Văn bản giao việc',
        to: { name: 'task-assignment-documents' },
        icon: { icon: 'tabler-file-text' },
        action: 'index',
        subject: 'TaskAssignmentDocuments',
      },
      {
        title: 'Danh sách công việc',
        to: { name: 'task-assignment-items' },
        icon: { icon: 'tabler-checklist' },
        action: 'index',
        subject: 'TaskAssignmentItems',
      },

      {
        title: 'Loại văn bản',
        to: { name: 'task-assignment-types' },
        icon: { icon: 'tabler-file-description' },
        action: 'index',
        subject: 'TaskAssignmentTypes',
      },
      {
        title: 'Loại công việc',
        to: { name: 'task-assignment-item-types' },
        icon: { icon: 'tabler-list' },
        action: 'index',
        subject: 'TaskAssignmentItemTypes',
      },
      {
        title: 'Phòng ban',
        to: { name: 'task-assignment-departments' },
        icon: { icon: 'tabler-building-warehouse' },
        action: 'index',
        subject: 'TaskAssignmentDepartments',
      },
    ],
  },

]
