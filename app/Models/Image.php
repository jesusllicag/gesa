<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Image extends Model
{
    use HasFactory;

    protected $fillable = [
        'operating_system_id',
        'nombre',
        'version',
        'arquitectura',
        'ami_id',
        'descripcion',
    ];

    public function operatingSystem(): BelongsTo
    {
        return $this->belongsTo(OperatingSystem::class);
    }

    public function servers(): HasMany
    {
        return $this->hasMany(Server::class);
    }
}
