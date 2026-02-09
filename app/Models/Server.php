<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

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
        'first_activated_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'clave_privada' => 'encrypted',
            'costo_diario' => 'decimal:4',
            'first_activated_at' => 'datetime',
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

    /**
     * @return Attribute<int, never>
     */
    protected function tiempoEncendidoTotal(): Attribute
    {
        return Attribute::make(
            get: function (): int {
                $total = (int) $this->first_activated_at;

                if ($this->estado === 'running' && $this->latest_release) {
                    $total += (int) now()->diffInSeconds($this->latest_release);
                }

                return $total;
            },
        );
    }
}
