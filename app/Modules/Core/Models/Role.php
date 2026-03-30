<?php

namespace App\Modules\Core\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Permission\Models\Role as SpatieRole;
use Spatie\Permission\PermissionRegistrar;

/**
 * Model Role (kế thừa Spatie), bổ sung scope filter. Cột theo mặc định Spatie: id, name, guard_name, team_id, timestamps.
 */
class Role extends SpatieRole
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Database\Factories\Modules\Core\Models\RoleFactory::new();
    }

    protected $fillable = [
        'name',
        'guard_name',
        'organization_id',
    ];

    /**
     * Scope lọc: search, from_date, to_date, sort (không có status).
     */
    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['search'] ?? null, function ($q, $search) {
            $q->where('name', 'like', '%'.$search.'%')
                ->orWhere('guard_name', 'like', '%'.$search.'%');
        })->when(isset($filters['from_date']) && $filters['from_date'], function ($q) use ($filters) {
            $q->whereDate('created_at', '>=', $filters['from_date']);
        })->when(isset($filters['to_date']) && $filters['to_date'], function ($q) use ($filters) {
            $q->whereDate('created_at', '<=', $filters['to_date']);
        })->when($filters['sort_by'] ?? 'id', function ($q, $sortBy) use ($filters) {
            $allowed = ['id', 'name', 'guard_name', 'created_at', 'updated_at'];
            $column = in_array($sortBy, $allowed) ? $sortBy : 'id';
            $q->orderBy($column, $filters['sort_order'] ?? 'desc');
        });

        return $query;
    }

    /**
     * Override to use explicit User model instead of dynamic guard lookup,
     * preventing "Class name must be a valid object or a string" errors.
     */
    public function users(): BelongsToMany
    {
        return $this->morphedByMany(
            User::class,
            'model',
            config('permission.table_names.model_has_roles'),
            app(PermissionRegistrar::class)->pivotRole,
            config('permission.column_names.model_morph_key')
        );
    }

    /** Quan hệ organization (bảng organizations). */
    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }
}
