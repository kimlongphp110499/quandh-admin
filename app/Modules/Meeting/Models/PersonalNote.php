<?php

namespace App\Modules\Meeting\Models;

use App\Modules\Core\Models\User;
use Illuminate\Database\Eloquent\Model;

class PersonalNote extends Model
{
    protected $table = 'm_personal_notes';

    protected $fillable = [
        'user_id',
        'meeting_id',
        'meeting_document_id',
        'content',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function meeting()
    {
        return $this->belongsTo(Meeting::class, 'meeting_id');
    }

    public function document()
    {
        return $this->belongsTo(MeetingDocument::class, 'meeting_document_id');
    }

    /** Scope: chỉ trả về ghi chú của người đang đăng nhập. */
    public function scopeMine($query)
    {
        return $query->where('user_id', auth()->id());
    }
}
