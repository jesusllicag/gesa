<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
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
        'fecha_alta',
        'ultimo_inicio',
        'tiempo_encendido_segundos',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'clave_privada' => 'encrypted',
            'costo_diario' => 'decimal:4',
            'fecha_alta' => 'datetime',
            'ultimo_inicio' => 'datetime',
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

    /**
     * @return Attribute<int, never>
     */
    protected function tiempoEncendidoTotal(): Attribute
    {
        return Attribute::make(
            get: function (): int {
                $total = (int) $this->tiempo_encendido_segundos;

                if ($this->estado === 'running' && $this->ultimo_inicio) {
                    $total += (int) now()->diffInSeconds($this->ultimo_inicio);
                }

                return $total;
            },
        );
    }
}
