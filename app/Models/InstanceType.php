<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InstanceType extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'familia',
        'vcpus',
        'procesador',
        'memoria_gb',
        'almacenamiento_incluido',
        'rendimiento_red',
        'precio_hora',
    ];

    protected function casts(): array
    {
        return [
            'memoria_gb' => 'decimal:2',
            'precio_hora' => 'decimal:4',
        ];
    }

    public function servers(): HasMany
    {
        return $this->hasMany(Server::class);
    }
}
