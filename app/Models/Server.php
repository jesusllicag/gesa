<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Server extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'nombre',
        'region',
        'operating_system_id',
        'image_id',
        'instance_type_id',
        'ram_gb',
        'disco_gb',
        'disco_tipo',
        'conexion',
        'clave_privada',
        'estado',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'clave_privada' => 'encrypted',
        ];
    }

    public function operatingSystem(): BelongsTo
    {
        return $this->belongsTo(OperatingSystem::class);
    }

    public function image(): BelongsTo
    {
        return $this->belongsTo(Image::class);
    }

    public function instanceType(): BelongsTo
    {
        return $this->belongsTo(InstanceType::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
