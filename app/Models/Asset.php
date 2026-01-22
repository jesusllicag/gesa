<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description',
        'category_id',
        'area_id',
        'status_id',
        'purchase_price',
        'purchase_date',
        'warranty_until',
        'model',
        'serial_number',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'purchase_date' => 'date',
        'warranty_until' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the category of this asset.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the area where this asset is located.
     */
    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    /**
     * Get the current status of this asset.
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(AssetStatus::class, 'status_id');
    }

    /**
     * Get the user who created this asset record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the assignments for this asset.
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    /**
     * Get the current assignment for this asset.
     */
    public function currentAssignment()
    {
        return $this->hasOne(Assignment::class)->whereNull('returned_at');
    }

    /**
     * Get the maintenance records for this asset.
     */
    public function maintenance(): HasMany
    {
        return $this->hasMany(Maintenance::class);
    }

    /**
     * Get the audit history for this asset.
     */
    public function histories(): HasMany
    {
        return $this->hasMany(AssetHistory::class);
    }
}
