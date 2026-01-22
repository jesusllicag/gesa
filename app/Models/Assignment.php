<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Assignment extends Model
{
    protected $fillable = [
        'asset_id',
        'user_id',
        'area_id',
        'assigned_at',
        'returned_at',
        'notes',
        'assigned_by',
    ];

    protected $casts = [
        'assigned_at' => 'date',
        'returned_at' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the asset being assigned.
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    /**
     * Get the user who received the asset.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the area where the asset is assigned.
     */
    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    /**
     * Get the user who made the assignment.
     */
    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    /**
     * Check if this assignment is active (not yet returned).
     */
    public function isActive(): bool
    {
        return is_null($this->returned_at);
    }
}
