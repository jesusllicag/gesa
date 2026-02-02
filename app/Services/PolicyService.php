<?php

namespace App\Services;

use App\Contracts\Interfaces\PermissionModules;
use Illuminate\Database\Eloquent\Collection;

class PolicyService implements PermissionModules
{
    public function groupPermissions(Collection $permissions): Collection
    {
        return $permissions->groupBy(function ($item) {
            $permission = explode('.', $item->slug)[1] ?? 'general';

            return self::MODULES[$permission] ?? 'General';
        });
    }
}
