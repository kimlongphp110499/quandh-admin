# 🚀 Deployment Guide - Quandh Admin

## ✅ Server đã chạy

**URL**: http://212.85.25.129:5175

**Login Page**: http://212.85.25.129:5175/login

**API Backend**: http://212.85.25.129/api

---

## 🔧 Server Details

- **Port**: 5175
- **Process**: `node vite --host 0.0.0.0 --port 5175`
- **Log file**: `/tmp/quandh-admin.log`
- **PID**: Check với `ps aux | grep vite | grep 5175`

---

## �� Test Login

### 1. Truy cập Login Page

```
http://212.85.25.129:5175/login
```

### 2. Nhập credentials

- Email: `admin@example.com` (hoặc email test từ Backend)
- Password: `password` (hoặc password từ Backend seeder)

### 3. Kiểm tra kết nối API

Mở Browser DevTools (F12) → Network tab → Nhập login

**Request sẽ gửi đến**:
```
POST http://212.85.25.129/api/auth/login
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "..."
  },
  "message": "Đăng nhập thành công"
}
```

---

## 🔍 Troubleshooting

### Lỗi: "Đăng nhập thất bại"

**Kiểm tra**:
1. Backend có chạy không: `curl http://212.85.25.129/api/user`
2. CORS có được config chưa (Backend phải allow origin)
3. Credentials đúng chưa (check database `users` table)

### Lỗi CORS

Nếu thấy lỗi CORS trong console:

```
Access to XMLHttpRequest at 'http://212.85.25.129/api/auth/login' 
from origin 'http://212.85.25.129:5175' has been blocked by CORS policy
```

**Giải pháp**: Update Backend CORS config

File: `quandh-core/config/cors.php`
```php
'allowed_origins' => [
    'http://212.85.25.129:5175',
    'http://localhost:5175',
],
```

Hoặc allow tất cả (dev only):
```php
'allowed_origins' => ['*'],
```

Sau đó restart Laravel:
```bash
cd /var/www/html/code/quandh-core
./vendor/bin/sail artisan config:clear
```

---

## 📝 Commands

### Start Server
```bash
cd /var/www/html/code/quandh-admin
nohup pnpm exec vite --host 0.0.0.0 --port 5175 > /tmp/quandh-admin.log 2>&1 &
```

### Stop Server
```bash
pkill -f "vite.*5175"
```

### View Logs
```bash
tail -f /tmp/quandh-admin.log
```

### Check Server Status
```bash
curl -I http://127.0.0.1:5175/
```

---

## 🔐 Security Note

**Development Mode** - Chỉ dùng cho testing!

Production cần:
1. Build static files: `pnpm run build`
2. Serve qua Nginx/Apache
3. HTTPS (SSL certificate)
4. Environment variables riêng cho production

---

## 📚 API Endpoints được sử dụng

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Đăng nhập |
| `/api/auth/logout` | POST | Đăng xuất |
| `/api/user` | GET | Lấy thông tin user hiện tại |
| `/api/meetings` | GET | Danh sách cuộc họp |
| `/api/meetings/{id}` | GET | Chi tiết cuộc họp |

---

## ✅ Next Steps

1. **Test Login** với credentials từ Backend
2. **Kiểm tra CORS** nếu có lỗi kết nối
3. **Tạo thêm pages**: Dashboard, Meeting List, etc.
4. **Setup Router Guard** để protect routes cần đăng nhập

---

**Updated**: March 26, 2026
**Status**: ✅ Ready for Testing

---

## 🔧 Bug Fixes (March 26, 2026)

### ✅ Fixed Import Errors

#### 1. Cookie Utility Missing
**Error**: `Failed to resolve import "@/@layouts/utils/cookie"`

**Fix**: Created `src/@core/utils/cookie.ts`
```ts
import { useCookie as useVueCookie } from '@vueuse/core'

export function useCookie<T = string>(key: string, options?: any) {
  return useVueCookie<T>(key, {
    ...options,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}
```

#### 2. Router Import Error
**Error**: `Failed to resolve import "@/router"`

**Fix**: Changed from static import to `useRouter()` hook
```ts
// Before
import router from '@/router'

// After
import { useRouter } from 'vue-router'
const router = useRouter() // inside function
```

#### 3. API Client Import Path
**Error**: `Failed to resolve import "./client"`

**Fix**: Fixed relative path in `api/modules/auth.ts`
```ts
// Before
import apiClient from './client'

// After
import apiClient from '../client'
```

### ✅ All Errors Resolved

Server now running without errors on http://212.85.25.129:5175
