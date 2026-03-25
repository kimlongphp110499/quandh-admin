<?php

namespace App\Modules\Meeting;

use App\Http\Controllers\Controller;
use App\Modules\Meeting\Models\Meeting;
use App\Modules\Meeting\Models\Voting;
use App\Modules\Meeting\Requests\StoreVotingRequest;
use App\Modules\Meeting\Requests\SubmitVoteRequest;
use App\Modules\Meeting\Resources\VotingCollection;
use App\Modules\Meeting\Resources\VotingResource;
use App\Modules\Meeting\Services\VotingService;
use Illuminate\Http\Request;

/**
 * @group Meeting - Biểu quyết
 *
 * Quản lý phiên biểu quyết: tạo, kích hoạt, thu phiếu, tổng hợp kết quả.
 * Hỗ trợ biểu quyết công khai (public) và ẩn danh (anonymous).
 */
class VotingController extends Controller
{
    public function __construct(private VotingService $votingService) {}

    /**
     * Danh sách phiên biểu quyết
     *
     * @urlParam meeting integer required ID cuộc họp.
     */
    public function index(Meeting $meeting)
    {
        $votings = $this->votingService->index($meeting);

        return $this->successCollection(new VotingCollection($votings));
    }

    /**
     * Tạo phiên biểu quyết
     *
     * @urlParam meeting integer required ID cuộc họp.
     * @bodyParam title string required Nội dung biểu quyết. Example: Thông qua kế hoạch ngân sách năm 2027
     * @bodyParam description string Mô tả chi tiết.
     * @bodyParam agenda_id integer Gắn với mục chương trình (nullable).
     * @bodyParam type string required Kiểu: public (công khai), anonymous (ẩn danh).
     */
    public function store(StoreVotingRequest $request, Meeting $meeting)
    {
        $voting = $this->votingService->store($meeting, $request->validated());

        return $this->successResource(new VotingResource($voting), 'Phiên biểu quyết đã được tạo!', 201);
    }

    /**
     * Thay đổi trạng thái phiên biểu quyết (Kích hoạt / Đóng)
     *
     * @urlParam meeting integer required ID cuộc họp.
     * @urlParam voting integer required ID phiên biểu quyết.
     * @bodyParam status string required Trạng thái: active (kích hoạt), closed (đóng). Example: active
     *
     * @response 200 {"success": true, "message": "Phiên biểu quyết đã được kích hoạt!"}
     */
    public function changeStatus(Request $request, Meeting $meeting, Voting $voting)
    {
        $request->validate(['status' => 'required|in:active,closed']);

        $voting = $this->votingService->changeStatus($voting, $request->status);

        $message = $request->status === 'active' ? 'Phiên biểu quyết đã được kích hoạt!' : 'Phiên biểu quyết đã được đóng!';

        return $this->successResource(new VotingResource($voting), $message);
    }

    /**
     * Gửi phiếu biểu quyết (Đại biểu)
     *
     * Người dùng phải là đại biểu trong cuộc họp và phiên biểu quyết phải đang active.
     *
     * @urlParam meeting integer required ID cuộc họp.
     * @urlParam voting integer required ID phiên biểu quyết.
     * @bodyParam vote_option string required Lựa chọn: agree, disagree, abstain. Example: agree
     *
     * @response 200 {"success": true, "message": "Biểu quyết của bạn đã được ghi nhận!"}
     */
    public function submitVote(SubmitVoteRequest $request, Meeting $meeting, Voting $voting)
    {
        $this->votingService->submitVote($voting, $request->vote_option);

        return $this->success(null, 'Biểu quyết của bạn đã được ghi nhận!');
    }

    /**
     * Kết quả tổng hợp biểu quyết
     *
     * Với anonymous voting, chỉ trả về tổng số phiếu theo từng lựa chọn, không lộ danh tính.
     *
     * @urlParam meeting integer required ID cuộc họp.
     * @urlParam voting integer required ID phiên biểu quyết.
     *
     * @response 200 {"success": true, "data": {"voting": {"id": 1, "title": "...", "type": "public", "status": "closed"}, "summary": {"agree": 8, "disagree": 2, "abstain": 1, "total": 11}, "details": null}}
     */
    public function results(Meeting $meeting, Voting $voting)
    {
        return $this->success($this->votingService->results($voting));
    }

    /**
     * Xóa phiên biểu quyết
     *
     * @urlParam meeting integer required ID cuộc họp.
     * @urlParam voting integer required ID phiên biểu quyết.
     *
     * @response 200 {"success": true, "message": "Phiên biểu quyết đã được xóa!"}
     */
    public function destroy(Meeting $meeting, Voting $voting)
    {
        $this->votingService->destroy($voting);

        return $this->success(null, 'Phiên biểu quyết đã được xóa!');
    }
}
