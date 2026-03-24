<?php

namespace App\Modules\Meeting\Policies;

use App\Modules\Core\Models\User;
use App\Modules\Meeting\Models\PersonalNote;
use Illuminate\Auth\Access\Response;

class PersonalNotePolicy
{
    /** Chỉ chủ sở hữu mới được xem ghi chú cá nhân */
    public function view(User $user, PersonalNote $note): Response
    { dd($user->id, $note->user_id);
        return $user->id === $note->user_id
            ? Response::allow()
            : Response::deny('Bạn không có quyền xem ghi chú này.');
    }

    /** Chỉ chủ sở hữu mới được cập nhật ghi chú cá nhân */
    public function update(User $user, PersonalNote $note): Response
    {
        return $user->id === $note->user_id
            ? Response::allow()
            : Response::deny('Bạn không có quyền chỉnh sửa ghi chú này.');
    }

    /** Chỉ chủ sở hữu mới được xóa ghi chú cá nhân */
    public function delete(User $user, PersonalNote $note): Response
    {
   
        return $user->id === $note->user_id
            ? Response::allow()
            : Response::deny('Bạn không có quyền xóa ghi chú này.');
    }
}
