export default [
  {
    title: 'Trang chủ',
    to: { name: 'root' },
    icon: { icon: 'tabler-smart-home' },
    action: 'read',
    subject: 'dashboard',
  },
  {
    title: 'Quản lý cuộc họp',
    icon: { icon: 'tabler-calendar-event' },
    children: [
      {
        title: 'Danh sách cuộc họp',
        to: { name: 'meetings-list' },
        action: 'read',
        subject: 'meetings',
      },
      {
        title: 'Tạo cuộc họp',
        to: { name: 'meetings-create' },
        action: 'create',
        subject: 'meetings',
      },
    ],
  },
  {
    title: 'Văn bản',
    icon: { icon: 'tabler-file-text' },
    children: [
      {
        title: 'Danh sách văn bản',
        to: { name: 'documents-list' },
        action: 'read',
        subject: 'documents',
      },
      {
        title: 'Tạo văn bản',
        to: { name: 'documents-create' },
        action: 'create',
        subject: 'documents',
      },
    ],
  },
  {
    title: 'Bài viết',
    icon: { icon: 'tabler-article' },
    children: [
      {
        title: 'Danh sách bài viết',
        to: { name: 'posts-list' },
        action: 'read',
        subject: 'posts',
      },
      {
        title: 'Danh mục',
        to: { name: 'post-categories-list' },
        action: 'read',
        subject: 'post_categories',
      },
    ],
  },
  {
    title: 'Hệ thống',
    icon: { icon: 'tabler-settings' },
    children: [
      {
        title: 'Người dùng',
        to: { name: 'users-list' },
        action: 'read',
        subject: 'users',
      },
      {
        title: 'Vai trò & Quyền',
        to: { name: 'roles-list' },
        action: 'read',
        subject: 'roles',
      },
      {
        title: 'Tổ chức',
        to: { name: 'organizations-list' },
        action: 'read',
        subject: 'organizations',
      },
    ],
  },
]

