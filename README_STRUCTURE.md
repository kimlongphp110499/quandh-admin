/**
 * README - Cấu trúc dự án Quandh Admin
 * 
 * ## Tổ chức thư mục
 * 
 * ```
 * src/
 * ├── api/                    # API client & endpoints
 * │   ├── client.ts          # Axios instance với interceptors
 * │   └── modules/           # API endpoints theo module
 * │       ├── auth.ts
 * │       └── meeting.ts
 * │
 * ├── store/                 # Pinia stores
 * │   └── modules/           # Stores theo module backend
 * │       ├── auth.ts
 * │       └── meeting.ts
 * │
 * ├── views/                 # Views/Pages
 * │   └── modules/           # Tổ chức theo module backend
 * │       ├── Meeting/
 * │       ├── Document/
 * │       ├── Post/
 * │       ├── Auth/
 * │       └── Core/
 * │
 * ├── @core/                 # Core components (từ template)
 * │   └── components/        # Shared components dùng chung
 * │
 * ├── navigation/            # Menu navigation
 * │   └── vertical/
 * │       └── index.ts       # Menu items với ACL
 * │
 * ├── utils/                 # Utilities
 * │   └── formatters.ts      # Format date, currency (tiếng Việt)
 * │
 * └── router/                # Vue Router
 *     └── routes/            # Route definitions với ACL
 * ```
 * 
 * ## Quy tắc coding
 * 
 * ### 1. Component Structure
 * - Sử dụng `<script setup lang="ts">` cho tất cả component
 * - Đặt tên file component theo PascalCase
 * - Component dùng chung → `/src/@core/components/`
 * - Component theo module → `/src/views/modules/<ModuleName>/`
 * 
 * ### 2. API Calls
 * - Tất cả API call phải thông qua `/src/api/client.ts`
 * - Token tự động được thêm vào header qua interceptor
 * - Response format chuẩn: `{ success, data, message, errors, meta }`
 * 
 * ### 3. State Management
 * - Mỗi module có 1 Pinia store riêng tại `/src/store/modules/`
 * - Store phải export: state, getters, actions
 * 
 * ### 4. Permissions & ACL
 * - Mỗi route và menu item phải có `action` và `subject`
 * - Ví dụ: `{ action: 'read', subject: 'meetings' }`
 * - Permissions được load từ Backend và lưu trong AuthStore
 * 
 * ### 5. UI/UX
 * - Tất cả label, placeholder, message phải tiếng Việt
 * - Format date: `DD/MM/YYYY` hoặc `HH:mm DD/MM/YYYY`
 * - Format currency: sử dụng `Intl.NumberFormat('vi-VN')`
 * - Responsive: tuân thủ Vuetify Grid system
 * 
 * ### 6. Form Validation
 * - Sử dụng Vee-Validate (đã tích hợp trong template)
 * - Validation client-side trước khi gửi API
 * - Hiển thị error từ Backend (422 status)
 * 
 * ## Environment Variables
 * 
 * File `.env`:
 * ```
 * VITE_API_BASE_URL=http://localhost:8001/api
 * VITE_APP_TITLE=Quandh Admin
 * ```
 * 
 * ## Commands
 * 
 * ```bash
 * pnpm install        # Cài dependencies
 * pnpm run dev        # Dev server (port 5173)
 * pnpm run build      # Build production
 * pnpm run preview    # Preview build
 * pnpm run lint       # ESLint check & fix
 * pnpm run typecheck  # TypeScript check
 * ```
 * 
 * ## Ví dụ tạo module mới
 * 
 * 1. Tạo API endpoint: `/src/api/modules/document.ts`
 * 2. Tạo Pinia store: `/src/store/modules/document.ts`
 * 3. Tạo views: `/src/views/modules/Document/DocumentList.vue`
 * 4. Thêm routes: `/src/router/routes/document.ts`
 * 5. Cập nhật navigation: `/src/navigation/vertical/index.ts`
 */

export {}
