<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
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
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Get the areas managed by this user.
     */
    public function managedAreas(): HasMany
    {
        return $this->hasMany(Area::class, 'manager_id');
    }

    /**
     * Get the assets created by this user.
     */
    public function createdAssets(): HasMany
    {
        return $this->hasMany(Asset::class, 'created_by');
    }

    /**
     * Get the assets assigned to this user.
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    /**
     * Get the assignments made by this user.
     */
    public function madeAssignments(): HasMany
    {
        return $this->hasMany(Assignment::class, 'assigned_by');
    }

    /**
     * Get the maintenance records performed by this user.
     */
    public function maintenanceRecords(): HasMany
    {
        return $this->hasMany(Maintenance::class, 'technician_id');
    }

    /**
     * Get the audit history entries created by this user.
     */
    public function auditHistory(): HasMany
    {
        return $this->hasMany(AssetHistory::class);
    }
}
