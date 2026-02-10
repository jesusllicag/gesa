<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class Client extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\ClientFactory> */
    use HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected string $guard_name = 'client';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nombre',
        'email',
        'password',
        'tipo_documento',
        'numero_documento',
        'must_change_password',
        'mp_customer_id',
        'created_by',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
        ];
    }

    /**
     * Get the user who created this client.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function servers(): HasMany
    {
        return $this->hasMany(Server::class);
    }

    public function solicitudes(): HasMany
    {
        return $this->hasMany(SolicitudServidor::class);
    }

    public function tarjetas(): HasMany
    {
        return $this->hasMany(TarjetaCliente::class);
    }
}
