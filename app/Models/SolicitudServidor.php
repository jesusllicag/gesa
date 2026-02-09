<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SolicitudServidor extends Model
{
    /** @use HasFactory<\Database\Factories\SolicitudServidorFactory> */
    use HasFactory, SoftDeletes;

    protected $table = 'solicitud_servidores';

    protected $fillable = [
        'client_id',
        'nombre',
        'region_id',
        'operating_system_id',
        'image_id',
        'instance_type_id',
        'ram_gb',
        'disco_gb',
        'disco_tipo',
        'conexion',
        'medio_pago',
        'costo_diario_estimado',
        'estado',
        'motivo_rechazo',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'costo_diario_estimado' => 'decimal:4',
            'reviewed_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
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

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
