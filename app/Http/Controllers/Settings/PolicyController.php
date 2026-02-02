<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Repositories\PolicyRepository;
use App\Services\PolicyService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Str;

class PolicyController extends Controller
{
    public function __construct(
        protected PolicyService $policyService,
        protected PolicyRepository $policyRepository
    ) {
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

    public function store(): RedirectResponse
    {
        $validated = request()->validate([
            'name' => ['required', 'alpha', 'max:255', 'unique:roles,name'],
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
        ]);

        return back()->with([
            'success' => 'Rol creado correctamente.',
            'newRoleId' => $role->id,
        ]);
    }

    public function update(int $roleId): RedirectResponse
    {
        $role = Role::findOrFail($roleId);
        $permissionIds = request()->input('permissions', []);

        $role->syncPermissions($permissionIds);

        return back()->with('success', 'Permisos actualizados correctamente.');
    }

    public function destroy(int $roleId): RedirectResponse
    {
        $role = Role::findOrFail($roleId);

        $protectedRoles = ['admin', 'manager'];
        if (in_array(strtolower($role->name), $protectedRoles)) {
            return back()->withErrors(['role' => 'No se puede eliminar este rol.']);
        }

        $role->delete();

        return back()->with('success', 'Rol eliminado correctamente.');
    }
}
