<?php

namespace App\Modules\Meeting\Services;

use App\Modules\Meeting\Enums\VotingTypeEnum;
use App\Modules\Meeting\Models\Meeting;
use App\Modules\Meeting\Models\Participant;
use App\Modules\Meeting\Models\Voting;
use App\Modules\Meeting\Models\VoteResult;
use Illuminate\Support\Facades\DB;

class VotingService
{
    public function index(Meeting $meeting): \Illuminate\Database\Eloquent\Collection
    {
        return $meeting->votings()->with('results')->get();
    }

    public function store(Meeting $meeting, array $validated): Voting
    {
        $validated['meeting_id'] = $meeting->id;

        return Voting::create($validated)->load('results');
    }

    /**
     * Kích hoạt hoặc đóng phiên biểu quyết.
     */
    public function changeStatus(Voting $voting, string $status): Voting
    {
        $data = ['status' => $status];

        if ($status === 'active') {
            $data['started_at'] = now();
        } elseif ($status === 'closed') {
            $data['closed_at'] = now();
        }

        $voting->update($data);

        return $voting->load('results');
    }

    /**
     * Đại biểu gửi phiếu biểu quyết.
     */
    public function submitVote(Voting $voting, string $voteOption): VoteResult
    {
        if ($voting->status !== 'active') {
            abort(422, 'Phiên biểu quyết chưa được kích hoạt hoặc đã đóng.');
        }

        $participant = Participant::where('meeting_id', $voting->meeting_id)
            ->where('user_id', auth()->id())
            ->first();

        $isAnonymous = $voting->type === VotingTypeEnum::Anonymous->value;

        if (! $isAnonymous) {
            // Voting công khai: kiểm tra đã vote chưa
            $alreadyVoted = VoteResult::where('voting_id', $voting->id)
                ->where('participant_id', $participant->id)
                ->exists();

            if ($alreadyVoted) {
                abort(422, 'Bạn đã biểu quyết rồi.');
            }

            return VoteResult::create([
                'voting_id' => $voting->id,
                'participant_id' => $participant->id,
                'vote_option' => $voteOption,
            ]);
        }

        // Voting ẩn danh: dùng cache/session để chặn double-vote trong request hiện tại
        // Lưu trạng thái đã vote bằng một bản ghi ẩn danh (participant_id = null)
        // Để ngăn double-vote, ta vẫn cần track. Dùng bảng có unique token hoặc session.
        // Giải pháp pragmatic: dùng cache key = "voted:{voting_id}:{participant_id}"
        $cacheKey = "voted:{$voting->id}:{$participant->id}";

        if (cache()->has($cacheKey)) {
            abort(422, 'Bạn đã biểu quyết rồi.');
        }

        $result = VoteResult::create([
            'voting_id' => $voting->id,
            'participant_id' => null, // ẩn danh
            'vote_option' => $voteOption,
        ]);

        // Đánh dấu đã vote trong cache (TTL = 24h)
        cache()->put($cacheKey, true, 86400);

        return $result;
    }

    public function destroy(Voting $voting): void
    {
        $voting->delete();
    }

    /**
     * Kết quả tổng hợp biểu quyết.
     */
    public function results(Voting $voting): array
    {
        $voting->load('results');

        return [
            'voting' => [
                'id' => $voting->id,
                'title' => $voting->title,
                'type' => $voting->type,
                'status' => $voting->status,
            ],
            'summary' => $voting->summary,
            // Với anonymous voting, không trả về chi tiết ai vote gì
            'details' => $voting->type === VotingTypeEnum::Public->value
                ? $voting->results->map(fn ($r) => [
                    'participant_id' => $r->participant_id,
                    'vote_option' => $r->vote_option,
                ])
                : null,
        ];
    }
}
