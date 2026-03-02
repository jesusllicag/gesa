<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;

class Server extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'nombre',
        'client_id',
        'hostname',
        'ip_address',
        'entorno',
        'region_id',
        'operating_system_id',
        'image_id',
        'instance_type_id',
        'ram_gb',
        'disco_gb',
        'disco_tipo',
        'conexion',
        'clave_privada',
        'estado',
        'costo_diario',
        'first_activated_at',
        'latest_release',
        'active_ms',
        'billed_active_ms',
        'created_by',
        'token_aprobacion',
    ];

    protected function casts(): array
    {
        return [
            'client_id' => 'integer',
            'clave_privada' => 'encrypted',
            'costo_diario' => 'decimal:4',
            'active_ms' => 'integer',
            'billed_active_ms' => 'integer',
            'latest_release' => 'datetime',
        ];
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
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

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function pagosMensuales(): HasMany
    {
        return $this->hasMany(PagoMensual::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['nombre', 'hostname', 'ip_address', 'entorno', 'estado', 'costo_diario', 'client_id'])
            ->logOnlyDirty()
            ->useLogName('servidores');
    }
}
