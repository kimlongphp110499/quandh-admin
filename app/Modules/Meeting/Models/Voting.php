<?php

namespace App\Modules\Meeting\Models;

use Illuminate\Database\Eloquent\Model;

class Voting extends Model
{
    protected $table = 'm_votings';

    protected $fillable = [
        'meeting_id',
        'title',
        'description',
        'type',
        'status',
        'started_at',
        'closed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function meeting()
    {
        return $this->belongsTo(Meeting::class, 'meeting_id');
    }

    public function results()
    {
        return $this->hasMany(VoteResult::class, 'voting_id');
    }

    /** Tổng hợp kết quả biểu quyết */
    public function getSummaryAttribute(): array
    {
        $results = $this->results()->selectRaw('vote_option, count(*) as total')
            ->groupBy('vote_option')
            ->pluck('total', 'vote_option')
            ->toArray();

        return [
            'agree' => $results['agree'] ?? 0,
            'disagree' => $results['disagree'] ?? 0,
            'abstain' => $results['abstain'] ?? 0,
            'total' => array_sum($results),
        ];
    }
}
