<?php

namespace App\Modules\Meeting;

use App\Http\Controllers\Controller;
use App\Modules\Meeting\Models\Meeting;
use App\Modules\Meeting\Models\SpeechRequest;
use App\Modules\Meeting\Requests\StoreSpeechRequest;
use App\Modules\Meeting\Requests\UpdateSpeechStatusRequest;
use App\Modules\Meeting\Resources\SpeechRequestCollection;
use App\Modules\Meeting\Resources\SpeechRequestResource;
use App\Modules\Meeting\Services\SpeechRequestService;
use Illuminate\Http\Request;

/**
 * @group Meeting - Đăng ký phát biểu
 *
 * Đại biểu đăng ký phát biểu; Quản lý duyệt hoặc từ chối.
 */
class SpeechRequestController extends Controller
{
    public function __construct(private SpeechRequestService $speechService) {}

    /**
     * Danh sách đăng ký phát biểu
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @queryParam status string Lọc trạng thái: pending, approved, rejected. Example: pending
     * @queryParam agenda_id integer Lọc theo mục chương trình. Example: 2
     *
     * @response 200 {"success": true, "data": [{"id": 1, "participant_id": 1, "participant_name": "Nguyễn Văn A", "agenda_id": 2, "agenda_title": "Thảo luận kế hoạch Q2", "content": "Đề xuất tăng ngân sách phòng CNTT.", "status": "pending", "rejection_reason": null, "created_at": "25/03/2026 08:30:00", "updated_at": "25/03/2026 08:30:00"}]}
     */
    public function index(Request $request, Meeting $meeting)
    {
        $requests = $this->speechService->index($meeting, $request->only(['status', 'agenda_id']));

        return $this->successCollection(new SpeechRequestCollection($requests));
    }

    /**
     * Đăng ký phát biểu (Đại biểu)
     *
     * Người dùng phải là đại biểu trong cuộc họp.
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @bodyParam agenda_id integer ID mục chương trình (nullable = phát biểu chung). Example: 2
     * @bodyParam content string required Nội dung ý kiến dự kiến (tối đa 2000 ký tự). Example: Đề xuất tăng ngân sách phòng CNTT.
     *
     * @response 201 {"success": true, "message": "Đăng ký phát biểu đã được gửi!", "data": {"id": 1, "participant_id": 1, "participant_name": "Nguyễn Văn A", "agenda_id": 2, "agenda_title": "Thảo luận kế hoạch Q2", "content": "Đề xuất tăng ngân sách phòng CNTT.", "status": "pending", "rejection_reason": null, "created_at": "25/03/2026 08:30:00", "updated_at": "25/03/2026 08:30:00"}}
     * @response 422 {"success": false, "message": "Dữ liệu không hợp lệ.", "errors": {"participant": ["Bạn không phải đại biểu của cuộc họp này."]}}
     */
    public function store(StoreSpeechRequest $request, Meeting $meeting)
    {
        $speechRequest = $this->speechService->store($meeting, $request->validated());

        return $this->successResource(new SpeechRequestResource($speechRequest), 'Đăng ký phát biểu đã được gửi!', 201);
    }

    /**
     * Duyệt hoặc từ chối đăng ký phát biểu (Quản lý / Chủ trì)
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @urlParam speechRequest integer required ID đăng ký. Example: 1
     * @bodyParam status string required Trạng thái: approved, rejected. Example: approved
     * @bodyParam rejection_reason string Lý do từ chối (bắt buộc khi rejected). Example: Đã quá số lượt phát biểu
     *
     * @response 200 {"success": true, "message": "Đã cập nhật trạng thái đăng ký phát biểu!", "data": {"id": 1, "participant_id": 1, "participant_name": "Nguyễn Văn A", "agenda_id": 2, "agenda_title": "Thảo luận kế hoạch Q2", "content": "Đề xuất tăng ngân sách phòng CNTT.", "status": "approved", "rejection_reason": null, "created_at": "25/03/2026 08:30:00", "updated_at": "25/03/2026 08:35:00"}}
     * @response 403 {"success": false, "message": "Chỉ chủ trì hoặc thư ký mới được duyệt đăng ký phát biểu."}
     */
    public function updateStatus(UpdateSpeechStatusRequest $request, Meeting $meeting, SpeechRequest $speechRequest)
    {
        $speechRequest = $this->speechService->updateStatus($speechRequest, $request->validated());

        return $this->successResource(new SpeechRequestResource($speechRequest), 'Đã cập nhật trạng thái đăng ký phát biểu!');
    }
}
