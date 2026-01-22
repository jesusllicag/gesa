<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Maintenance extends Model
{
    protected $table = 'maintenance';

    protected $fillable = [
        'asset_id',
        'maintenance_type_id',
        'scheduled_date',
        'completed_date',
        'description',
        'findings',
        'actions_taken',
        'cost',
        'technician_id',
        'status',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'completed_date' => 'date',
        'cost' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the asset being maintained.
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    /**
     * Get the type of maintenance.
     */
    public function type(): BelongsTo
    {
        return $this->belongsTo(MaintenanceType::class, 'maintenance_type_id');
    }

    /**
     * Get the technician who performed the maintenance.
     */
    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    /**
     * Check if this maintenance is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }
}
