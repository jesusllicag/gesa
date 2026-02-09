<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PagoMensual extends Model
{
    protected $table = 'pagos_mensuales';

    protected $fillable = [
        'server_id',
        'anio',
        'mes',
        'monto',
        'estado',
        'fecha_pago',
        'observaciones',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'decimal:4',
            'fecha_pago' => 'datetime',
        ];
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
