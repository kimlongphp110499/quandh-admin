# API Phòng họp không giấy (Meeting)

Quản lý toàn bộ vòng đời cuộc họp: tạo, kích hoạt, điều hành, biểu quyết, kết luận, ghi chú cá nhân.

**Base path:** `/api/meetings`

**Headers bắt buộc (tất cả endpoint yêu cầu auth):**
```
Authorization: Bearer {access_token}
Accept: application/json
X-Organization-Id: {org_id}
```

**Biến môi trường dùng trong các lệnh curl bên dưới:**
```bash
BASE="http://localhost:8001/api"
T="your_access_token_here"
ORG=1
```

---

## 1. CUỘC HỌP (Meetings)

### 1.1 Thống kê

| | |
|---|---|
| **Method** | GET |
| **Path** | `/api/meetings/stats` |
| **Query** | `search`, `status` (draft \| active \| in_progress \| ended), `from_date` (Y-m-d), `to_date` (Y-m-d), `sort_by`, `sort_order`, `limit` |
| **Response** | `{ "total": 10, "draft": 2, "active": 3, "in_progress": 1, "ended": 4 }` |

```bash
curl -s "$BASE/meetings/stats" \
  -H "Authorization: Bearer $T" 
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

### 1.2 Danh sách cuộc họp

| | |
|---|---|
| **Method** | GET |
| **Path** | `/api/meetings` |
| **Query** | `search`, `status`, `from_date`, `to_date`, `sort_by` (id \| title \| start_at \| end_at \| created_at), `sort_order` (asc \| desc), `limit` (1-100) |

```bash
curl -s "$BASE/meetings?limit=10&sort_by=start_at&sort_order=desc" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

### 1.3 Chi tiết cuộc họp

| | |
|---|---|
| **Method** | GET |
| **Path** | `/api/meetings/{id}` |

```bash
curl -s "$BASE/meetings/1" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

### 1.4 Tạo cuộc họp

| | |
|---|---|
| **Method** | POST |
| **Path** | `/api/meetings` |
| **Body** | `title` (required), `description`, `location`, `start_at` (datetime), `end_at` (datetime, >= start_at) |
| **Response** | 201, MeetingResource |

```bash
curl -s -X POST "$BASE/meetings" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "title": "Họp hội đồng tháng 3/2026",
    "description": "Họp triển khai kế hoạch quý 2",
    "location": "Phòng họp A - Tầng 3",
    "start_at": "2026-03-25 08:00:00",
    "end_at": "2026-03-25 11:00:00"
  }' | python3 -m json.tool
```

---

### 1.5 Cập nhật cuộc họp

| | |
|---|---|
| **Method** | PUT / PATCH |
| **Path** | `/api/meetings/{id}` |
| **Body** | `title`, `description`, `location`, `start_at`, `end_at` (tất cả tùy chọn) |

```bash
curl -s -X PATCH "$BASE/meetings/1" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "location": "Phòng họp B - Tầng 5",
    "start_at": "2026-03-25 09:00:00"
  }' | python3 -m json.tool
```

---

### 1.6 Đổi trạng thái cuộc họp

Luồng hợp lệ: `draft` → `active` → `in_progress` → `ended`.
Khi chuyển sang `active`, hệ thống sẽ gửi thông báo cho đại biểu.

| | |
|---|---|
| **Method** | PATCH |
| **Path** | `/api/meetings/{id}/status` |
| **Body** | `status` (required: draft \| active \| in_progress \| ended) |

```bash
# Kích hoạt cuộc họp (gửi thông báo cho đại biểu)
curl -s -X PATCH "$BASE/meetings/1/status" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{"status": "active"}' | python3 -m json.tool

# Bắt đầu họp
curl -s -X PATCH "$BASE/meetings/1/status" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{"status": "in_progress"}' | python3 -m json.tool

# Kết thúc cuộc họp
curl -s -X PATCH "$BASE/meetings/1/status" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{"status": "ended"}' | python3 -m json.tool
```

---

### 1.7 Xóa cuộc họp

| | |
|---|---|
| **Method** | DELETE |
| **Path** | `/api/meetings/{id}` |

```bash
curl -s -X DELETE "$BASE/meetings/1" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

## 2. CHƯƠNG TRÌNH HỌP (Agendas)

### 2.1 Danh sách mục chương trình

| | |
|---|---|
| **Method** | GET |
| **Path** | `/api/meetings/{meeting}/agendas` |

```bash
curl -s "$BASE/meetings/1/agendas" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

### 2.2 Thêm mục chương trình

| | |
|---|---|
| **Method** | POST |
| **Path** | `/api/meetings/{meeting}/agendas` |
| **Body** | `title` (required), `description`, `order_index` (integer >= 0), `duration` (phút, 1-480) |

```bash
curl -s -X POST "$BASE/meetings/1/agendas" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "title": "Báo cáo kết quả quý 1",
    "description": "Trình bày số liệu doanh thu và chi phí",
    "order_index": 0,
    "duration": 30
  }' | python3 -m json.tool
```
```bash
curl -s -X POST "$BASE/meetings/1/agendas" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "title": "Kế hoạch ngân sách quý 2",
    "order_index": 1,
    "duration": 45
  }' | python3 -m json.tool
```

---

### 2.3 Cập nhật mục chương trình

| | |
|---|---|
| **Method** | PUT / PATCH |
| **Path** | `/api/meetings/{meeting}/agendas/{agenda}` |

```bash
curl -s -X PATCH "$BASE/meetings/1/agendas/1" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{"duration": 40}' | python3 -m json.tool
```

---

### 2.4 Sắp xếp lại thứ tự chương trình

| | |
|---|---|
| **Method** | POST |
| **Path** | `/api/meetings/{meeting}/agendas/reorder` |
| **Body** | `orders` (array of `{id, order_index}`) |

```bash
curl -s -X POST "$BASE/meetings/1/agendas/reorder" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "orders": [
      {"id": 2, "order_index": 0},
      {"id": 1, "order_index": 1}
    ]
  }' | python3 -m json.tool
```

---

### 2.5 Đặt mục đang thảo luận (điều hướng real-time)

Đánh dấu mục agenda đang được thảo luận. Broadcast sự kiện đến Vue.js của tất cả đại biểu.

| | |
|---|---|
| **Method** | POST |
| **Path** | `/api/meetings/{meeting}/agendas/{agenda}/set-current` |

```bash
curl -s -X POST "$BASE/meetings/1/agendas/2/set-current" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

### 2.6 Xóa mục chương trình

| | |
|---|---|
| **Method** | DELETE |
| **Path** | `/api/meetings/{meeting}/agendas/{agenda}` |

```bash
curl -s -X DELETE "$BASE/meetings/1/agendas/1" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

## 3. ĐẠI BIỂU (Participants)

### 3.1 Danh sách đại biểu

| | |
|---|---|
| **Method** | GET |
| **Path** | `/api/meetings/{meeting}/participants` |

```bash
curl -s "$BASE/meetings/1/participants" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

### 3.2 Thêm đại biểu vào cuộc họp

Có thể thêm nhiều người cùng lúc. Người đã có trong cuộc họp sẽ bị bỏ qua (không lỗi).

| | |
|---|---|
| **Method** | POST |
| **Path** | `/api/meetings/{meeting}/participants` |
| **Body** | `user_ids` (array, required), `meeting_role` (required: chair \| secretary \| delegate), `position` (chức vụ, optional) |

```bash
# Thêm chủ trì
curl -s -X POST "$BASE/meetings/1/participants" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "user_ids": [1],
    "meeting_role": "chair",
    "position": "Giám đốc"
  }' | python3 -m json.tool
```

```bash
# Thêm thư ký
curl -s -X POST "$BASE/meetings/1/participants" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "user_ids": [2],
    "meeting_role": "secretary",
    "position": "Trưởng phòng Hành chính"
  }' | python3 -m json.tool
```

```bash
# Thêm nhiều đại biểu cùng lúc
curl -s -X POST "$BASE/meetings/1/participants" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "user_ids": [3, 4, 5],
    "meeting_role": "delegate",
    "position": "Đại biểu"
  }' | python3 -m json.tool
```

---

### 3.3 Cập nhật thông tin đại biểu

| | |
|---|---|
| **Method** | PATCH |
| **Path** | `/api/meetings/{meeting}/participants/{participant}` |
| **Body** | `meeting_role`, `position` |

```bash
curl -s -X PATCH "$BASE/meetings/1/participants/3" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{"position": "Trưởng phòng CNTT"}' | python3 -m json.tool
```

---

### 3.4 Điểm danh

Đại biểu tự xác nhận có mặt hoặc quản lý cập nhật trạng thái.
Khi `attendance_status = present`, hệ thống tự ghi nhận `checkin_at = now()`.

| | |
|---|---|
| **Method** | PATCH |
| **Path** | `/api/meetings/{meeting}/participants/{participant}/checkin` |
| **Body** | `attendance_status` (required: not_arrived \| present \| absent), `absence_reason` |

```bash
# Đại biểu xác nhận có mặt
curl -s -X PATCH "$BASE/meetings/1/participants/3/checkin" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{"attendance_status": "present"}' | python3 -m json.tool

# Ghi nhận vắng mặt
curl -s -X PATCH "$BASE/meetings/1/participants/4/checkin" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "attendance_status": "absent",
    "absence_reason": "Công tác nước ngoài"
  }' | python3 -m json.tool
```

---

### 3.5 Xóa đại biểu khỏi cuộc họp

| | |
|---|---|
| **Method** | DELETE |
| **Path** | `/api/meetings/{meeting}/participants/{participant}` |

```bash
curl -s -X DELETE "$BASE/meetings/1/participants/5" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

## 4. TÀI LIỆU HỌP (Documents)

### 4.1 Danh sách tài liệu

| | |
|---|---|
| **Method** | GET |
| **Path** | `/api/meetings/{meeting}/documents` |

```bash
curl -s "$BASE/meetings/1/documents" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

### 4.2 Upload tài liệu họp

| | |
|---|---|
| **Method** | POST |
| **Path** | `/api/meetings/{meeting}/documents` |
| **Body** | `documents[]` (file, required – pdf/doc/docx/xls/xlsx/ppt/pptx/txt/png/jpg, tối đa 50MB/file, tối đa 20 file), `name` (tên hiển thị, optional) |

```bash
# Upload 1 file
curl -s -X POST "$BASE/meetings/1/documents" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" \
  -F "documents[]=@/path/to/bao-cao-quy1.pdf" \
  -F "name=Báo cáo kết quả quý 1" | python3 -m json.tool

# Upload nhiều file
curl -s -X POST "$BASE/meetings/1/documents" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" \
  -F "documents[]=@/path/to/tai-lieu-1.pdf" \
  -F "documents[]=@/path/to/tai-lieu-2.docx" | python3 -m json.tool
```

---

### 4.3 Xóa tài liệu họp

| | |
|---|---|
| **Method** | DELETE |
| **Path** | `/api/meetings/{meeting}/documents/{document}` |

```bash
curl -s -X DELETE "$BASE/meetings/1/documents/1" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

## 5. GHI CHÚ CÁ NHÂN (Personal Notes)

**Bảo mật:** API chỉ trả về ghi chú của người đang đăng nhập. Tuyệt đối không thấy ghi chú của đại biểu khác.

### 5.1 Lấy ghi chú cá nhân

| | |
|---|---|
| **Method** | GET |
| **Path** | `/api/meetings/{meeting}/personal-notes` |
| **Query** | `document_id` — lọc theo tài liệu cụ thể (optional) |

```bash
# Tất cả ghi chú trong cuộc họp
curl -s "$BASE/meetings/1/personal-notes" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool

# Ghi chú trên tài liệu cụ thể
curl -s "$BASE/meetings/1/personal-notes?document_id=2" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

### 5.2 Lưu ghi chú cá nhân (tạo mới hoặc auto-save)

Nếu đã có ghi chú cho cùng cuộc họp + tài liệu, nội dung sẽ được ghi đè (upsert).
Dùng cho tính năng **auto-save** từ Vue.js sidebar.

| | |
|---|---|
| **Method** | POST |
| **Path** | `/api/meetings/{meeting}/personal-notes` |
| **Body** | `content` (required), `meeting_document_id` (optional – gắn với tài liệu) |

```bash
# Ghi chú chung cho cuộc họp
curl -s -X POST "$BASE/meetings/1/personal-notes" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "content": "Cần xem lại điều khoản ngân sách mục 3.2"
  }' | python3 -m json.tool
```
# Ghi chú gắn với tài liệu cụ thể (khi đọc tài liệu ID=2)
curl -s -X POST "$BASE/meetings/1/personal-notes" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "meeting_document_id": 2,
    "content": "Số liệu trang 5 cần đối chiếu với báo cáo tháng 2"
  }' | python3 -m json.tool
```

---

### 5.3 Xóa ghi chú cá nhân

Chỉ chủ sở hữu ghi chú mới có thể xóa (kiểm tra qua Policy).

| | |
|---|---|
| **Method** | DELETE |
| **Path** | `/api/meetings/{meeting}/personal-notes/{note}` |

```bash
curl -s -X DELETE "$BASE/meetings/1/personal-notes/1" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

## 6. ĐĂNG KÝ PHÁT BIỂU (Speech Requests)

### 6.1 Danh sách đăng ký phát biểu

| | |
|---|---|
| **Method** | GET |
| **Path** | `/api/meetings/{meeting}/speech-requests` |
| **Query** | `status` (pending \| approved \| rejected), `agenda_id` |

```bash
# Tất cả đăng ký
curl -s "$BASE/meetings/1/speech-requests" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool

# Lọc đang chờ duyệt
curl -s "$BASE/meetings/1/speech-requests?status=pending" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

### 6.2 Đại biểu đăng ký phát biểu

Người dùng phải là đại biểu trong cuộc họp (có bản ghi trong `m_participants`).

| | |
|---|---|
| **Method** | POST |
| **Path** | `/api/meetings/{meeting}/speech-requests` |
| **Body** | `agenda_id` (optional – phát biểu về mục nào), `content` (ý kiến dự kiến, optional) |

```bash
# Đăng ký phát biểu về mục agenda_id=2
curl -s -X POST "$BASE/meetings/1/speech-requests" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "agenda_id": 2,
    "content": "Đề xuất tăng 15% ngân sách cho phòng CNTT trong quý 2"
  }' | python3 -m json.tool

# Phát biểu chung (không gắn với agenda cụ thể)
curl -s -X POST "$BASE/meetings/1/speech-requests" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{"content": "Góp ý về quy trình báo cáo định kỳ"}' | python3 -m json.tool
```

---

### 6.3 Duyệt / Từ chối đăng ký phát biểu (Chủ trì / Quản lý)

| | |
|---|---|
| **Method** | PATCH |
| **Path** | `/api/meetings/{meeting}/speech-requests/{speechRequest}/status` |
| **Body** | `status` (required: approved \| rejected), `rejection_reason` (bắt buộc khi rejected) |

```bash
# Duyệt
curl -s -X PATCH "$BASE/meetings/1/speech-requests/1/status" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{"status": "approved"}' | python3 -m json.tool

# Từ chối
curl -s -X PATCH "$BASE/meetings/1/speech-requests/2/status" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "status": "rejected",
    "rejection_reason": "Nội dung không liên quan đến chương trình họp"
  }' | python3 -m json.tool
```

---

### 6.4 Hủy đăng ký phát biểu

| | |
|---|---|
| **Method** | DELETE |
| **Path** | `/api/meetings/{meeting}/speech-requests/{speechRequest}` |

```bash
curl -s -X DELETE "$BASE/meetings/1/speech-requests/1" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

## 7. BIỂU QUYẾT (Votings)

Hỗ trợ 2 loại: **public** (công khai – lưu danh tính) và **anonymous** (ẩn danh – không lộ danh tính).
Lựa chọn biểu quyết: `agree` (Đồng ý), `disagree` (Không đồng ý), `abstain` (Không biểu quyết).

### 7.1 Danh sách phiên biểu quyết

| | |
|---|---|
| **Method** | GET |
| **Path** | `/api/meetings/{meeting}/votings` |

```bash
curl -s "$BASE/meetings/1/votings" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

### 7.2 Tạo phiên biểu quyết

| | |
|---|---|
| **Method** | POST |
| **Path** | `/api/meetings/{meeting}/votings` |
| **Body** | `title` (required), `description`, `agenda_id` (optional), `type` (required: public \| anonymous) |

```bash
# Biểu quyết công khai
curl -s -X POST "$BASE/meetings/1/votings" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "title": "Thông qua kế hoạch ngân sách quý 2 năm 2026",
    "description": "Tổng ngân sách 500 triệu đồng",
    "type": "public"
  }' | python3 -m json.tool

# Biểu quyết ẩn danh
curl -s -X POST "$BASE/meetings/1/votings" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "title": "Bầu chọn phương án A hay phương án B",
    "type": "anonymous"
  }' | python3 -m json.tool
```

---

### 7.3 Kích hoạt / Đóng phiên biểu quyết

| | |
|---|---|
| **Method** | PATCH |
| **Path** | `/api/meetings/{meeting}/votings/{voting}/status` |
| **Body** | `status` (required: active \| closed) |

```bash
# Kích hoạt phiên biểu quyết
curl -s -X PATCH "$BASE/meetings/1/votings/1/status" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{"status": "active"}' | python3 -m json.tool

# Đóng phiên biểu quyết
curl -s -X PATCH "$BASE/meetings/1/votings/1/status" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{"status": "closed"}' | python3 -m json.tool
```

---

### 7.4 Đại biểu gửi phiếu biểu quyết

Phiên biểu quyết phải đang `active`. Mỗi đại biểu chỉ được biểu quyết 1 lần.

| | |
|---|---|
| **Method** | POST |
| **Path** | `/api/meetings/{meeting}/votings/{voting}/vote` |
| **Body** | `vote_option` (required: agree \| disagree \| abstain) |

```bash
# Đồng ý
curl -s -X POST "$BASE/meetings/1/votings/1/vote" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{"vote_option": "agree"}' | python3 -m json.tool

# Không đồng ý
curl -s -X POST "$BASE/meetings/1/votings/1/vote" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{"vote_option": "disagree"}' | python3 -m json.tool

# Không biểu quyết
curl -s -X POST "$BASE/meetings/1/votings/1/vote" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{"vote_option": "abstain"}' | python3 -m json.tool
```

---

### 7.5 Kết quả biểu quyết

Với anonymous voting: chỉ trả về tổng số phiếu, không lộ danh tính (`details: null`).
Với public voting: kèm danh sách chi tiết ai chọn gì.

| | |
|---|---|
| **Method** | GET |
| **Path** | `/api/meetings/{meeting}/votings/{voting}/results` |

```bash
curl -s "$BASE/meetings/1/votings/1/results" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

**Response mẫu (public voting):**
```json
{
  "success": true,
  "data": {
    "voting": {
      "id": 1,
      "title": "Thông qua kế hoạch ngân sách quý 2",
      "type": "public",
      "status": "closed"
    },
    "summary": {
      "agree": 8,
      "disagree": 2,
      "abstain": 1,
      "total": 11
    },
    "details": [
      { "participant_id": 3, "vote_option": "agree" },
      { "participant_id": 4, "vote_option": "disagree" }
    ]
  }
}
```

**Response mẫu (anonymous voting):**
```json
{
  "success": true,
  "data": {
    "voting": { "id": 2, "title": "Bầu chọn phương án", "type": "anonymous", "status": "closed" },
    "summary": { "agree": 6, "disagree": 3, "abstain": 2, "total": 11 },
    "details": null
  }
}
```

---

### 7.6 Xóa phiên biểu quyết

| | |
|---|---|
| **Method** | DELETE |
| **Path** | `/api/meetings/{meeting}/votings/{voting}` |

```bash
curl -s -X DELETE "$BASE/meetings/1/votings/1" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

## 8. KẾT LUẬN (Conclusions)

Mỗi cuộc họp có thể có nhiều kết luận (1:N). Có thể gắn kết luận với một mục chương trình cụ thể.

### 8.1 Danh sách kết luận

| | |
|---|---|
| **Method** | GET |
| **Path** | `/api/meetings/{meeting}/conclusions` |

```bash
curl -s "$BASE/meetings/1/conclusions" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

### 8.2 Tạo kết luận mới

| | |
|---|---|
| **Method** | POST |
| **Path** | `/api/meetings/{meeting}/conclusions` |
| **Body** | `title` (required), `content` (required), `agenda_id` (optional – gắn với mục họp) |

```bash
# Kết luận gắn với mục chương trình
curl -s -X POST "$BASE/meetings/1/conclusions" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "title": "Kết luận về ngân sách quý 2",
    "content": "Hội đồng đồng thuận thông qua ngân sách 500 triệu đồng cho quý 2/2026. Giao phòng Tài chính lập kế hoạch phân bổ chi tiết trước ngày 01/04/2026.",
    "agenda_id": 2
  }' | python3 -m json.tool

# Kết luận chung không gắn với mục cụ thể
curl -s -X POST "$BASE/meetings/1/conclusions" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "title": "Lịch họp quý 2",
    "content": "Thống nhất tổ chức họp hội đồng định kỳ vào thứ Hai tuần đầu tiên mỗi tháng."
  }' | python3 -m json.tool
```

---

### 8.3 Cập nhật kết luận

| | |
|---|---|
| **Method** | PUT / PATCH |
| **Path** | `/api/meetings/{meeting}/conclusions/{conclusion}` |

```bash
curl -s -X PATCH "$BASE/meetings/1/conclusions/1" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG" \
  -d '{
    "content": "Hội đồng đồng thuận thông qua ngân sách 500 triệu đồng. Phòng Tài chính lập kế hoạch trước 01/04/2026. Phòng CNTT ưu tiên đầu tư hạ tầng bảo mật."
  }' | python3 -m json.tool
```

---

### 8.4 Xóa kết luận

| | |
|---|---|
| **Method** | DELETE |
| **Path** | `/api/meetings/{meeting}/conclusions/{conclusion}` |

```bash
curl -s -X DELETE "$BASE/meetings/1/conclusions/1" \
  -H "Authorization: Bearer $T" \
  -H "Accept: application/json" \
  -H "X-Organization-Id: $ORG" | python3 -m json.tool
```

---

## 9. KỊCH BẢN KIỂM THỬ TOÀN BỘ LUỒNG

```bash
BASE="http://localhost:8001/api"
ORG=1

# Bước 1: Đăng nhập
T=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Token: $T"

# Bước 2: Tạo cuộc họp
MEETING_ID=$(curl -s -X POST "$BASE/meetings" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-Organization-Id: $ORG" \
  -d '{"title":"Họp hội đồng tháng 3","start_at":"2026-03-25 08:00:00","end_at":"2026-03-25 11:00:00","location":"Phòng họp A"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "Meeting ID: $MEETING_ID"

# Bước 3: Thêm chương trình họp
curl -s -X POST "$BASE/meetings/$MEETING_ID/agendas" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-Organization-Id: $ORG" \
  -d '{"title":"Báo cáo quý 1","order_index":0,"duration":30}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('Agenda:', d['data']['id'])"

AGENDA_ID=$(curl -s -X POST "$BASE/meetings/$MEETING_ID/agendas" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-Organization-Id: $ORG" \
  -d '{"title":"Kế hoạch quý 2","order_index":1,"duration":45}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "Agenda ID: $AGENDA_ID"

# Bước 4: Thêm đại biểu (user_id 2=chủ trì, 3=thư ký, 4,5,6=đại biểu)
curl -s -X POST "$BASE/meetings/$MEETING_ID/participants" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-Organization-Id: $ORG" \
  -d '{"user_ids":[2],"meeting_role":"chair","position":"Giám đốc"}' > /dev/null

curl -s -X POST "$BASE/meetings/$MEETING_ID/participants" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-Organization-Id: $ORG" \
  -d '{"user_ids":[3],"meeting_role":"secretary","position":"Trưởng phòng Hành chính"}' > /dev/null

curl -s -X POST "$BASE/meetings/$MEETING_ID/participants" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-Organization-Id: $ORG" \
  -d '{"user_ids":[4,5,6],"meeting_role":"delegate","position":"Đại biểu"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('Participants added:', len(d.get('data',[])))"

# Bước 5: Kích hoạt cuộc họp
curl -s -X PATCH "$BASE/meetings/$MEETING_ID/status" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-Organization-Id: $ORG" \
  -d '{"status":"active"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('Status:', d['data']['status'])"

# Bước 6: Bắt đầu họp
curl -s -X PATCH "$BASE/meetings/$MEETING_ID/status" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-Organization-Id: $ORG" \
  -d '{"status":"in_progress"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('Status:', d['data']['status'])"

# Bước 7: Điểm danh (participant_id cần lấy từ GET participants)
PART_LIST=$(curl -s "$BASE/meetings/$MEETING_ID/participants" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" -H "X-Organization-Id: $ORG")
PART_ID=$(echo $PART_LIST | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][2]['id'])")
curl -s -X PATCH "$BASE/meetings/$MEETING_ID/participants/$PART_ID/checkin" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-Organization-Id: $ORG" \
  -d '{"attendance_status":"present"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('Checkin:', d['data']['attendance_status'])"

# Bước 8: Tạo & kích hoạt biểu quyết
VOTING_ID=$(curl -s -X POST "$BASE/meetings/$MEETING_ID/votings" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-Organization-Id: $ORG" \
  -d "{\"title\":\"Thông qua ngân sách quý 2\",\"type\":\"public\",\"agenda_id\":$AGENDA_ID}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

curl -s -X PATCH "$BASE/meetings/$MEETING_ID/votings/$VOTING_ID/status" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-Organization-Id: $ORG" \
  -d '{"status":"active"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('Voting status:', d['data']['status'])"

# Biểu quyết
curl -s -X POST "$BASE/meetings/$MEETING_ID/votings/$VOTING_ID/vote" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-Organization-Id: $ORG" \
  -d '{"vote_option":"agree"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('Vote:', d.get('message',''))"

# Đóng & xem kết quả
curl -s -X PATCH "$BASE/meetings/$MEETING_ID/votings/$VOTING_ID/status" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-Organization-Id: $ORG" \
  -d '{"status":"closed"}' > /dev/null

curl -s "$BASE/meetings/$MEETING_ID/votings/$VOTING_ID/results" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" -H "X-Organization-Id: $ORG" \
  | python3 -m json.tool

# Bước 9: Tạo kết luận
curl -s -X POST "$BASE/meetings/$MEETING_ID/conclusions" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-Organization-Id: $ORG" \
  -d "{\"title\":\"Kết luận ngân sách\",\"content\":\"Thông qua ngân sách 500 triệu đồng.\",\"agenda_id\":$AGENDA_ID}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('Conclusion:', d['data']['id'])"

# Bước 10: Kết thúc cuộc họp
curl -s -X PATCH "$BASE/meetings/$MEETING_ID/status" \
  -H "Authorization: Bearer $T" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-Organization-Id: $ORG" \
  -d '{"status":"ended"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('Final status:', d['data']['status'])"

echo "=== DONE ==="
```

---

## Response mẫu

### MeetingResource
```json
{
  "id": 1,
  "title": "Họp hội đồng tháng 3/2026",
  "description": "Họp triển khai kế hoạch quý 2",
  "location": "Phòng họp A - Tầng 3",
  "start_at": "25/03/2026 08:00",
  "end_at": "25/03/2026 11:00",
  "status": "in_progress",
  "agendas": [
    { "id": 1, "title": "Báo cáo quý 1", "order_index": 0, "duration": 30, "is_current": true },
    { "id": 2, "title": "Kế hoạch quý 2", "order_index": 1, "duration": 45, "is_current": false }
  ],
  "participants": [
    { "id": 1, "user_id": 2, "user_name": "Nguyễn Văn A", "position": "Giám đốc", "meeting_role": "chair", "attendance_status": "present", "checkin_at": "22/03/2026 08:05:12" }
  ],
  "conclusions": [],
  "created_by": "Admin",
  "created_at": "22/03/2026 07:00:00"
}
```

### Trạng thái biểu quyết (`summary`)
```json
{
  "agree": 8,
  "disagree": 2,
  "abstain": 1,
  "total": 11
}
```
