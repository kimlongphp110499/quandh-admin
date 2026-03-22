<?php

namespace App\Modules\Meeting\Models;

use App\Modules\Core\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * Model pivot mở rộng cho bảng m_participants.
 * Vừa dùng được trong belongsToMany()->using(), vừa truy vấn trực tiếp.
 */
class Participant extends Pivot
{
    protected $table = 'm_participants';

    public $incrementing = true;

    protected $fillable = [
        'meeting_id',
        'user_id',
        'position',
        'meeting_role',
        'attendance_status',
        'checkin_at',
        'absence_reason',
    ];

    protected $casts = [
        'checkin_at' => 'datetime',
    ];

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class, 'meeting_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function speechRequests()
    {
        return $this->hasMany(SpeechRequest::class, 'participant_id');
    }

    public function voteResults()
    {
        return $this->hasMany(VoteResult::class, 'participant_id');
    }
}
