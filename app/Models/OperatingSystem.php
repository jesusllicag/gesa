<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OperatingSystem extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'slug',
        'logo',
    ];

    public function images(): HasMany
    {
        return $this->hasMany(Image::class);
    }

    public function servers(): HasMany
    {
        return $this->hasMany(Server::class);
    }
}
