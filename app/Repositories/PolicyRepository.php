<?php

namespace App\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Exceptions\HttpResponseException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PolicyRepository {
    public function selectRoles(...$columns): Collection {
        return Role::select($columns ?: ['*'])->with('permissions:id,name,slug')->get();
    }

    public function allPermissions(...$columns): Collection {
        return Permission::select($columns ?: ['*'])->get();
    }

}
