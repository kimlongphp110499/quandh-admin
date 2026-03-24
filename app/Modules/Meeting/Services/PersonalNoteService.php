<?php

namespace App\Modules\Meeting\Services;

use App\Modules\Meeting\Models\Meeting;
use App\Modules\Meeting\Models\PersonalNote;

class PersonalNoteService
{
    /**
     * Lấy ghi chú của người đang đăng nhập trong cuộc họp (hoặc tài liệu cụ thể).
     */
    public function index(Meeting $meeting, ?int $documentId = null): \Illuminate\Database\Eloquent\Collection
    {
        return PersonalNote::mine()
            ->where('meeting_id', $meeting->id)
            ->when($documentId, fn ($q, $id) => $q->where('meeting_document_id', $id))
            ->get();
    }

    /**
     * Tìm ghi chú hiện có theo user + meeting + document.
     */
    public function findExisting(Meeting $meeting, ?int $documentId): ?PersonalNote
    {
        return PersonalNote::mine()
            ->where('meeting_id', $meeting->id)
            ->where('meeting_document_id', $documentId)
            ->first();
    }

    /**
     * Tạo hoặc cập nhật ghi chú (upsert theo user + meeting + document).
     */
    public function upsert(Meeting $meeting, array $validated): PersonalNote
    {
        $note = PersonalNote::updateOrCreate(
            [
                'user_id' => auth()->id(),
                'meeting_id' => $meeting->id,
                'meeting_document_id' => $validated['meeting_document_id'] ?? null,
            ],
            ['content' => $validated['content']]
        );

        return $note;
    }

    public function destroy(PersonalNote $note): void
    {
        $note->delete();
    }
}
