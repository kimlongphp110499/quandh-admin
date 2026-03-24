<?php

namespace App\Modules\Meeting;

use App\Http\Controllers\Controller;
use App\Modules\Meeting\Models\Meeting;
use App\Modules\Meeting\Models\PersonalNote;
use App\Modules\Meeting\Requests\StorePersonalNoteRequest;
use App\Modules\Meeting\Resources\PersonalNoteResource;
use App\Modules\Meeting\Services\PersonalNoteService;
use Illuminate\Http\Request;

/**
 * @group Meeting - Ghi chú cá nhân
 *
 * Ghi chú riêng tư của từng đại biểu. Dữ liệu hoàn toàn cô lập – API chỉ trả về ghi chú của người đang đăng nhập.
 */
class PersonalNoteController extends Controller
{
    public function __construct(private PersonalNoteService $noteService) {}

    /**
     * Lấy ghi chú cá nhân trong cuộc họp
     *
     * Trả về tất cả ghi chú của người đăng nhập trong cuộc họp. Có thể lọc theo tài liệu cụ thể.
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @queryParam document_id integer Lọc theo ID tài liệu. Example: 5
     */
    public function index(Request $request, Meeting $meeting)
    {
        $notes = $this->noteService->index($meeting, $request->integer('document_id') ?: null);

        return $this->success(PersonalNoteResource::collection($notes)->resolve());
    }

    /**
     * Lưu ghi chú cá nhân (tạo mới hoặc cập nhật)
     *
     * Nếu đã có ghi chú cho cùng cuộc họp + tài liệu, nội dung sẽ được ghi đè (upsert).
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @bodyParam content string required Nội dung ghi chú. Example: Cần xem xét lại điều khoản 5.
     * @bodyParam meeting_document_id integer ID tài liệu (để gắn ghi chú với tài liệu cụ thể). Example: 3
     */
    public function upsert(StorePersonalNoteRequest $request, Meeting $meeting)
    {
        $existing = $this->noteService->findExisting($meeting, $request->integer('meeting_document_id') ?: null);

        if ($existing) {
            $this->authorize('update', $existing);
        }

        $note = $this->noteService->upsert($meeting, $request->validated());

        return $this->successResource(new PersonalNoteResource($note), 'Ghi chú đã được lưu!');
    }

    /**
     * Xóa ghi chú cá nhân
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @urlParam note integer required ID ghi chú. Example: 1
     *
     * @response 200 {"success": true, "message": "Ghi chú đã được xóa!"}
     */
    public function destroy(Meeting $meeting, PersonalNote $note)
    {
        $this->authorize('delete', $note);

        $this->noteService->destroy($note);

        return $this->success(null, 'Ghi chú đã được xóa!');
    }
}
