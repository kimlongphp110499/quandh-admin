export default [
  {
    title: 'Trang chủ',
    to: { name: 'index' },
    icon: { icon: 'tabler-smart-home' },
  },
  {
    title: 'Quản lý cuộc họp',
    icon: { icon: 'tabler-calendar-event' },
    children: [
      {
        title: 'Tổng quan',
        to: { name: 'meetings-dashboard' },
        icon: { icon: 'tabler-layout-dashboard' },
        action: 'index',
        subject: 'Meetings',
      },
      {
        title: 'Danh sách cuộc họp',
        to: { name: 'meetings' },
        icon: { icon: 'tabler-list' },
        action: 'index',
        subject: 'Meetings',
      },
      {
        title: 'Điều hành cuộc họp',
        to: { name: 'meetings-conduct' },
        icon: { icon: 'tabler-presentation' },
        action: 'index',
        subject: 'Meetings',
      },
      {
        title: 'Soạn thảo kết luận',
        to: { name: 'meetings-conclusions' },
        icon: { icon: 'tabler-file-text' },
        action: 'index',
        subject: 'Meetings',
      },
    ],
  },
]
