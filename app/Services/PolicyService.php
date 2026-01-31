<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Collection;
use App\Contracts\Interfaces\PermissionModules;


class PolicyService implements PermissionModules {
    public function groupPermissions(Collection $permissions): Collection {
        return $permissions->groupBy(function ($item) {
            $permission = explode('.', $item->slug)[0] ?? 'general';
            return self::MODULES[$permission] ?? 'General';
        });
    }

}
