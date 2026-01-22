<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaintenanceType extends Model
{
    protected $table = 'maintenance_types';

    protected $fillable = ['name', 'description'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the maintenance records of this type.
     */
    public function maintenance(): HasMany
    {
        return $this->hasMany(Maintenance::class);
    }
}
