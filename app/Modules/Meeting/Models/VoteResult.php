<?php

namespace App\Modules\Meeting\Models;

use Illuminate\Database\Eloquent\Model;

class VoteResult extends Model
{
    protected $table = 'm_vote_results';

    protected $fillable = [
        'voting_id',
        'participant_id',
        'vote_option',
    ];

    public function voting()
    {
        return $this->belongsTo(Voting::class, 'voting_id');
    }

    public function participant()
    {
        return $this->belongsTo(Participant::class, 'participant_id');
    }
}
