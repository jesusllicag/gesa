<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\PolicyService;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PolicyController extends Controller {
    public function __construct(protected PolicyService $policyService)
    {
    }

    public function edit(): Response
    {
        return Inertia::render('policies/index', [
            'roles' => $this->policyService
                ->selectRoles('id', 'name')
                ->map(fn ($role) => ['id' => $role->id, 'name' => ucwords($role->name)])
                ->toArray(),
        ]);
    }
}
