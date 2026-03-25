<?php

namespace App\Modules\Meeting;

use App\Http\Controllers\Controller;
use App\Modules\Meeting\Models\Agenda;
use App\Modules\Meeting\Models\Meeting;
use App\Modules\Meeting\Requests\ReorderAgendasRequest;
use App\Modules\Meeting\Requests\StoreAgendaRequest;
use App\Modules\Meeting\Requests\UpdateAgendaRequest;
use App\Modules\Meeting\Resources\AgendaCollection;
use App\Modules\Meeting\Resources\AgendaResource;
use App\Modules\Meeting\Services\AgendaService;

/**
 * @group Meeting - Chương trình họp (Agenda)
 *
 * Quản lý mục chương trình họp.
 */
class AgendaController extends Controller
{
    public function __construct(private AgendaService $agendaService) {}

    /**
     * Danh sách mục chương trình họp
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     *
     * @response 200 {"success": true, "data": [{"id": 1, "meeting_id": 1, "title": "Báo cáo tháng 2", "description": "Báo cáo kết quả công việc", "order_index": 0, "duration": 30, "is_current": true, "created_at": "25/03/2026 07:00:00", "updated_at": "25/03/2026 07:00:00"}, {"id": 2, "meeting_id": 1, "title": "Thảo luận kế hoạch Q2", "description": null, "order_index": 1, "duration": 45, "is_current": false, "created_at": "25/03/2026 07:05:00", "updated_at": "25/03/2026 07:05:00"}]}
     */
    public function index(Meeting $meeting)
    {
        $agendas = $this->agendaService->index($meeting);

        return $this->successCollection(new AgendaCollection($agendas));
    }

    /**
     * Thêm mục chương trình họp
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @bodyParam title string required Tiêu đề mục. Example: Báo cáo tháng 2
     * @bodyParam description string Mô tả chi tiết. Example: Báo cáo kết quả công việc tháng 2
     * @bodyParam duration integer Thời lượng (phút). Example: 30
     * @bodyParam order_index integer Thứ tự hiển thị (bắt đầu từ 0). Example: 0
     *
     * @response 201 {"success": true, "message": "Mục chương trình đã được thêm!", "data": {"id": 1, "meeting_id": 1, "title": "Báo cáo tháng 2", "description": "Báo cáo kết quả công việc tháng 2", "order_index": 0, "duration": 30, "is_current": false, "created_at": "25/03/2026 07:00:00", "updated_at": "25/03/2026 07:00:00"}}
     * @response 422 {"success": false, "message": "Dữ liệu không hợp lệ.", "errors": {"title": ["Tiêu đề mục họp không được để trống."]}}
     */
    public function store(StoreAgendaRequest $request, Meeting $meeting)
    {
        $agenda = $this->agendaService->store($meeting, $request->validated());

        return $this->successResource(new AgendaResource($agenda), 'Mục chương trình đã được thêm!', 201);
    }

    /**
     * Cập nhật mục chương trình họp
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @urlParam agenda integer required ID mục chương trình. Example: 1
     * @bodyParam title string Tiêu đề mục. Example: Báo cáo tháng 2 (cập nhật)
     * @bodyParam description string Mô tả. Example: Nội dung mới
     * @bodyParam duration integer Thời lượng (phút, tối đa 480). Example: 45
     * @bodyParam order_index integer Thứ tự mới. Example: 1
     *
     * @response 200 {"success": true, "message": "Mục chương trình đã được cập nhật!", "data": {"id": 1, "meeting_id": 1, "title": "Báo cáo tháng 2 (cập nhật)", "description": "Nội dung mới", "order_index": 1, "duration": 45, "is_current": false, "created_at": "25/03/2026 07:00:00", "updated_at": "25/03/2026 08:00:00"}}
     * @response 404 {"success": false, "message": "Không tìm thấy mục chương trình."}
     */
    public function update(UpdateAgendaRequest $request, Meeting $meeting, Agenda $agenda)
    {
        $agenda = $this->agendaService->update($agenda, $request->validated());

        return $this->successResource(new AgendaResource($agenda), 'Mục chương trình đã được cập nhật!');
    }

    /**
     * Xóa mục chương trình họp
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @urlParam agenda integer required ID mục chương trình. Example: 1
     *
     * @response 200 {"success": true, "message": "Mục chương trình đã được xóa!"}
     */
    public function destroy(Meeting $meeting, Agenda $agenda)
    {
        $this->agendaService->destroy($agenda);

        return $this->success(null, 'Mục chương trình đã được xóa!');
    }

    /**
     * Đặt mục đang thảo luận (real-time điều hướng)
     *
     * Đánh dấu agenda đang được thảo luận. Trigger event để đồng bộ màn hình tất cả đại biểu.
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @urlParam agenda integer required ID mục chương trình. Example: 2
     *
     * @response 200 {"success": true, "message": "Đã chuyển sang mục thảo luận!"}
     */
    public function setCurrent(Meeting $meeting, Agenda $agenda)
    {
        $agenda = $this->agendaService->setCurrent($agenda);

        return $this->successResource(new AgendaResource($agenda), 'Đã chuyển sang mục thảo luận!');
    }

    /**
     * Sắp xếp lại thứ tự chương trình họp (Drag-and-drop)
     *
     * @urlParam meeting integer required ID cuộc họp. Example: 1
     * @bodyParam orders array required Danh sách thứ tự. Example: [{"id": 1, "order_index": 0}, {"id": 2, "order_index": 1}]
     *
     * @response 200 {"success": true, "message": "Thứ tự chương trình đã được cập nhật!"}
     */
    public function reorder(ReorderAgendasRequest $request, Meeting $meeting)
    {
        $this->agendaService->reorder($meeting, $request->orders);

        return $this->success(null, 'Thứ tự chương trình đã được cập nhật!');
    }
}
