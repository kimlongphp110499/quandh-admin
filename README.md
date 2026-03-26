# Quandh Admin - Frontend Vue.js

Admin panel được xây dựng dựa trên **Vuexy Template** với các quy tắc coding chuẩn.

## 🚀 Quick Start

\`\`\`bash
cd /var/www/html/code/quandh-admin
pnpm install
pnpm run dev         # Dev server http://localhost:5173
\`\`\`

## 📚 Tài liệu chi tiết

- [README_STRUCTURE.md](./README_STRUCTURE.md) - Cấu trúc dự án & quy tắc coding
- [README_VUEXY.md](./README_VUEXY.md) - Tài liệu gốc của Vuexy template

## 📁 Cấu trúc quan trọng

\`\`\`
src/
├── api/modules/        # API endpoints (auth.ts, meeting.ts)
├── store/modules/      # Pinia stores  
├── views/modules/      # Views theo module backend
├── utils/formatters.ts # Date/Currency format tiếng Việt
└── navigation/         # Menu với ACL
\`\`\`

## ⚙️ Environment (.env)

\`\`\`env
VITE_API_BASE_URL=http://localhost:8001/api
VITE_APP_TITLE=Quandh Admin
\`\`\`

## 🎯 Quy tắc chính

✅ Script setup + TypeScript  
✅ Pinia cho state management  
✅ ACL trên routes & menu  
✅ UI tiếng Việt  
✅ Format date: DD/MM/YYYY  

Xem chi tiết: [README_STRUCTURE.md](./README_STRUCTURE.md)
