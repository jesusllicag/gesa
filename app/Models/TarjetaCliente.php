<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TarjetaCliente extends Model
{
    /** @use HasFactory<\Database\Factories\TarjetaClienteFactory> */
    use HasFactory;

    protected $table = 'tarjetas_cliente';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'client_id',
        'mp_card_id',
        'last_four_digits',
        'first_six_digits',
        'brand',
        'expiration_month',
        'expiration_year',
        'cardholder_name',
        'payment_type',
    ];

    /**
     * Get the client that owns the card.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
