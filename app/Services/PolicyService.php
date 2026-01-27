<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Role;

class PolicyService {
    public function selectRoles(...$columns): Collection {
        return Role::select($columns ?: ['*'])->get();
    }
}
