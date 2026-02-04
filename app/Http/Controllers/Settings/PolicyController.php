<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Repositories\PolicyRepository;
use App\Services\PolicyService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

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
        $user = auth()->user();

        $roles = $user->can('list.policies')
            ? $this->policyRepository->selectRoles('id', 'name')
            : null;

        $permissions = $user->can('list.policies')
            ? $this->policyService->groupPermissions(
                $this->policyRepository->allPermissions('id', 'name', 'slug')
            )
            : null;

        return Inertia::render('policies/index', [
            'roles' => $roles,
            'permissions' => $permissions,
            'userPermissions' => [
                'canList' => $user->can('list.policies'),
                'canCreate' => $user->can('create.policies'),
                'canUpdate' => $user->can('update.policies'),
                'canDelete' => $user->can('delete.policies'),
            ],
        ]);
    }

    public function store(): RedirectResponse
    {
        if (! auth()->user()->can('create.policies')) {
            abort(403, 'No tienes permiso para crear roles.');
        }

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
        if (! auth()->user()->can('update.policies')) {
            abort(403, 'No tienes permiso para modificar permisos.');
        }

        $role = Role::findOrFail($roleId);
        $permissionIds = request()->input('permissions', []);

        $role->syncPermissions($permissionIds);

        return back()->with('success', 'Permisos actualizados correctamente.');
    }

    public function destroy(int $roleId): RedirectResponse
    {
        if (! auth()->user()->can('delete.policies')) {
            abort(403, 'No tienes permiso para eliminar roles.');
        }

        $role = Role::findOrFail($roleId);

        $protectedRoles = ['admin', 'manager'];
        if (in_array(strtolower($role->name), $protectedRoles)) {
            return back()->withErrors(['role' => 'No se puede eliminar este rol.']);
        }

        $role->delete();

        return back()->with('success', 'Rol eliminado correctamente.');
    }
}
