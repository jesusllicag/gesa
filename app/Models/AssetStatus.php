<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssetStatus extends Model
{
    protected $table = 'asset_statuses';

    protected $fillable = ['name', 'description', 'color', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the assets with this status.
     */
    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'status_id');
    }
}
