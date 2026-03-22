<?php

namespace App\Modules\Meeting;

use App\Http\Controllers\Controller;
use App\Modules\Core\Requests\FilterRequest;
use App\Modules\Meeting\Models\Meeting;
use App\Modules\Meeting\Models\Participant;
use App\Modules\Meeting\Requests\BulkDestroyParticipantRequest;
use App\Modules\Meeting\Requests\BulkUpdateStatusParticipantRequest;
use App\Modules\Meeting\Requests\CheckinRequest;
use App\Modules\Meeting\Requests\ImportParticipantRequest;
use App\Modules\Meeting\Requests\StoreParticipantRequest;
use App\Modules\Meeting\Requests\UpdateParticipantRequest;
use App\Modules\Meeting\Resources\ParticipantCollection;
use App\Modules\Meeting\Resources\ParticipantResource;
use App\Modules\Meeting\Services\ParticipantService;

/**
 * @group Meeting - Đại biểu (Participants)
 *
 * Quản lý đại biểu tham dự và điểm danh.
 */
class ParticipantController extends Controller
{
    public function __construct(private ParticipantService $participantService) {}

    /**
     * Danh sách đại biểu
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     */
    public function index(Meeting $meeting)
    {
        $participants = $this->participantService->index($meeting);

        return $this->successCollection(new ParticipantCollection($participants));
    }
    /**
     * Chi tiết đại biểu
     *
     * @urlParam meeting integer required ID cuộc họ p. Example: 1
     * @urlParam participant integer required ID đại biểu. Example: 1
     */
    public function show(Meeting $meeting, Participant $participant)
    {
        $participant = $this->participantService->show($participant);

        return $this->successResource(new ParticipantResource($participant));
    }
    /**
     * Thêm đại biểu vào cuộc họp
     *
     * Thêm nhiều người dùng cùng lúc. Người dùng đã có trong cuộc họp sẽ bị bỏ qua.
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @bodyParam user_ids array required Danh sách ID người dùng. Example: [1, 2, 3]
     * @bodyParam meeting_role string required Vai trò: chair, secretary, delegate. Example: delegate
     * @bodyParam position string Chức vụ (tên chức danh). Example: Trưởng phòng CNTT
     */
    public function store(StoreParticipantRequest $request, Meeting $meeting)
    {
        $participants = $this->participantService->store($meeting, $request->validated());

        return $this->successCollection(new ParticipantCollection($participants), 'Đại biểu đã được thêm vào cuộc họp!');
    }

    /**
     * Cập nhật thông tin đại biểu
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @urlParam participant integer required ID đại biểu. Example: 1
     * @bodyParam meeting_role string Vai trò: chair, secretary, delegate.
     * @bodyParam position string Chức vụ.
     */
    public function update(UpdateParticipantRequest $request, Meeting $meeting, Participant $participant)
    {
        $participant = $this->participantService->update($participant, $request->validated());

        return $this->successResource(new ParticipantResource($participant), 'Thông tin đại biểu đã được cập nhật!');
    }

    /**
     * Xóa đại biểu khỏi cuộc họp
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @urlParam participant integer required ID đại biểu. Example: 1
     *
     * @response 200 {"success": true, "message": "Đại biểu đã được xóa khỏi cuộc họp!"}
     */
    public function destroy(Meeting $meeting, Participant $participant)
    {
        $this->participantService->destroy($participant);

        return $this->success(null, 'Đại biểu đã được xóa khỏi cuộc họp!');
    }

    /**
     * Điểm danh đại biểu
     *
     * Đại biểu tự xác nhận có mặt hoặc quản lý cập nhật trạng thái điểm danh.
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @urlParam participant integer required ID đại biểu. Example: 1
     * @bodyParam attendance_status string required Trạng thái: not_arrived, present, absent. Example: present
     * @bodyParam absence_reason string Lý do vắng (yêu cầu khi absent).
     */
    public function checkin(CheckinRequest $request, Meeting $meeting, Participant $participant)
    {
        if ($participant->attendance_status !== 'not_arrived') {
            return $this->error('Đại biểu đã điểm danh rồi.', 422);
        }

        $participant = $this->participantService->checkin(
            $participant,
            $request->attendance_status,
            $request->absence_reason
        );

        return $this->successResource(new ParticipantResource($participant), 'Điểm danh thành công!');
    }

    /**
     * Thay đổi trạng thái điểm danh (Admin)
     *
     * Admin cưỡng chế cập nhật trạng thái điểm danh, không bị ràng buộc trạng thái hiện tại.
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @urlParam participant integer required ID đại biểu. Example: 1
     * @bodyParam attendance_status string required Trạng thái: not_arrived, present, absent. Example: present
     * @bodyParam absence_reason string Lý do vắng (yêu cầu khi absent).
     */
    public function changeStatus(CheckinRequest $request, Meeting $meeting, Participant $participant)
    {
        $participant = $this->participantService->changeStatus(
            $participant,
            $request->attendance_status,
            $request->absence_reason
        );

        return $this->successResource(new ParticipantResource($participant), 'Trạng thái điểm danh đã được cập nhật!');
    }

    /**
     * Xóa hàng loạt đại biểu
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @bodyParam ids array required Danh sách ID đại biểu. Example: [1, 2, 3]
     *
     * @response 200 {"success": true, "message": "Đã xóa thành công các đại biểu được chọn!"}
     */
    public function bulkDestroy(BulkDestroyParticipantRequest $request, Meeting $meeting)
    {
        $this->participantService->bulkDestroy($meeting, $request->ids);

        return $this->success(null, 'Đã xóa thành công các đại biểu được chọn!');
    }

    /**
     * Cập nhật trạng thái hàng loạt đại biểu
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @bodyParam ids array required Danh sách ID đại biểu. Example: [1, 2]
     * @bodyParam attendance_status string required Trạng thái: not_arrived, present, absent. Example: present
     *
     * @response 200 {"success": true, "message": "Cập nhật trạng thái thành công!"}
     */
    public function bulkUpdateStatus(BulkUpdateStatusParticipantRequest $request, Meeting $meeting)
    {
        $this->participantService->bulkUpdateStatus($meeting, $request->ids, $request->attendance_status);

        return $this->success(null, 'Cập nhật trạng thái điểm danh thành công các đại biểu được chọn!');
    }

    /**
     * Xuất danh sách đại biểu
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     */
    public function export(Meeting $meeting)
    {
        return $this->participantService->export($meeting);
    }

    /**
     * Nhập danh sách đại biểu
     *
     * Cột bắt buộc: email. Cột không bắt buộc: meeting_role, position.
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @bodyParam file file required File xlsx, xls hoặc csv.
     *
     * @response 200 {"success": true, "message": "Nhập danh sách đại biểu thành công!"}
     */
    public function import(ImportParticipantRequest $request, Meeting $meeting)
    {
        $this->participantService->import($meeting, $request->file('file'));

        return $this->success(null, 'Nhập danh sách đại biểu thành công!');
    }
}
