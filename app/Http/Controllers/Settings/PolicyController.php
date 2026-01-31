<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Repositories\PolicyRepository;
use App\Services\PolicyService;
use Inertia\Inertia;
use Inertia\Response;

class PolicyController extends Controller {

    public function __construct(
        protected PolicyService $policyService,
        protected PolicyRepository $policyRepository
    )
    {
        //
    }

    public function index(): Response
    {
        $roles = $this->policyRepository->selectRoles('id', 'name');
        $permissions = $this->policyService->groupPermissions(
            $this->policyRepository->allPermissions('id', 'name', 'slug')
        );
        return Inertia::render('policies/index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }
}
