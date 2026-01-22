# 💡 Ejemplos de Uso - Modelos Eloquent GESA

## 🎯 Ejemplos Prácticos de Consultas

### 1. Trabajar con Activos

#### Crear un nuevo activo

```php
$asset = Asset::create([
    'code' => 'ASSET-001',
    'name' => 'Dell Laptop XPS 13',
    'description' => 'Laptop para desarrollo',
    'category_id' => 1, // Equipos de Cómputo
    'area_id' => 2,     // Tecnología
    'status_id' => 1,   // Activo
    'purchase_price' => 1200.00,
    'purchase_date' => '2025-01-15',
    'warranty_until' => '2027-01-15',
    'model' => 'XPS 13 9370',
    'serial_number' => 'ABC123XYZ',
    'created_by' => auth()->id(),
]);
```

#### Obtener activo con todas sus relaciones

```php
$asset = Asset::with(['category', 'area', 'status', 'creator'])->find(1);

echo $asset->name;                  // Dell Laptop XPS 13
echo $asset->category->name;        // Equipos de Cómputo
echo $asset->area->location;        // Piso 2
echo $asset->status->name;          // Activo
```

#### Obtener activos de una categoría específica

```php
$computerAssets = Category::where('code', 'EQC')
    ->first()
    ->assets()
    ->with('status', 'area')
    ->get();
```

#### Obtener activos por estado

```php
$activeAssets = Asset::whereHas('status', function ($q) {
    $q->where('name', 'Activo');
})->with('category', 'area')->get();

$maintenanceAssets = Asset::whereHas('status', function ($q) {
    $q->where('name', 'En Mantenimiento');
})->get();
```

#### Obtener historial de cambios de un activo

```php
$asset = Asset::find(1);
$history = $asset->histories()->orderBy('created_at', 'desc')->get();

foreach ($history as $record) {
    echo $record->action . ' - ' . $record->field . ': ' . $record->old_value . ' → ' . $record->new_value;
}
```

#### Actualizar estado de un activo

```php
$asset = Asset::find(1);
$maintenanceStatus = AssetStatus::where('name', 'En Mantenimiento')->first();
$asset->update(['status_id' => $maintenanceStatus->id]);
```

---

### 2. Trabajar con Asignaciones

#### Asignar un activo a un usuario

```php
$assignment = Assignment::create([
    'asset_id' => 1,
    'user_id' => 3,                    // Usuario que lo recibe
    'area_id' => 2,                    // Área donde se usa
    'assigned_at' => now()->toDateString(),
    'assigned_by' => auth()->id(),     // Usuario que asigna
    'notes' => 'Laptop para proyecto del cliente X',
]);
```

#### Obtener asignación actual de un activo

```php
$asset = Asset::find(1);
$currentAssignment = $asset->currentAssignment; // Relación HasOne

if ($currentAssignment) {
    echo $currentAssignment->user->name;  // Nombre del usuario
    echo $currentAssignment->assigned_at; // Fecha de asignación
}
```

#### Obtener todos los activos asignados a un usuario

```php
$user = User::find(3);
$userAssets = $user->assignments()
    ->whereNull('returned_at')  // Asignaciones activas
    ->with('asset.category', 'asset.status')
    ->get();

foreach ($userAssets as $assignment) {
    echo $assignment->asset->name . ' (' . $assignment->asset->category->name . ')';
}
```

#### Devolver un activo

```php
$assignment = Assignment::find(1);
$assignment->update(['returned_at' => now()->toDateString()]);

// Ahora el activo está disponible para asignar a otro usuario
```

#### Obtener historial de asignaciones de un activo

```php
$asset = Asset::find(1);
$assignmentHistory = $asset->assignments()
    ->orderBy('assigned_at', 'desc')
    ->get();

foreach ($assignmentHistory as $assignment) {
    $returnedText = $assignment->returned_at ? " (devuelto el {$assignment->returned_at})" : " (actualmente asignado)";
    echo $assignment->user->name . " desde " . $assignment->assigned_at . $returnedText;
}
```

---

### 3. Trabajar con Mantenimientos

#### Programar un mantenimiento

```php
$maintenance = Maintenance::create([
    'asset_id' => 1,
    'maintenance_type_id' => 1,        // Preventivo
    'scheduled_date' => now()->addMonths(3)->toDateString(),
    'description' => 'Mantenimiento preventivo trimestral',
    'status' => 'pending',
    'technician_id' => null,           // Asignar después
]);
```

#### Registrar mantenimiento completado

```php
$maintenance = Maintenance::find(1);
$maintenance->update([
    'completed_date' => now()->toDateString(),
    'findings' => 'Hardware en buen estado, batería al 90%',
    'actions_taken' => 'Limpieza interna, actualización de drivers',
    'cost' => 150.00,
    'technician_id' => auth()->id(),
    'status' => 'completed',
]);
```

#### Obtener activos que necesitan mantenimiento

```php
$assetsNeedingMaintenance = Maintenance::where('status', 'pending')
    ->where('scheduled_date', '<=', now()->toDateString())
    ->with('asset.category', 'type', 'technician')
    ->get();

foreach ($assetsNeedingMaintenance as $maintenance) {
    echo $maintenance->asset->name . ' - ' . $maintenance->type->name;
}
```

#### Obtener historial de mantenimientos de un activo

```php
$asset = Asset::find(1);
$maintenanceHistory = $asset->maintenance()
    ->where('status', 'completed')
    ->orderBy('completed_date', 'desc')
    ->with('type', 'technician')
    ->get();

foreach ($maintenanceHistory as $record) {
    echo $record->type->name . ' realizado por ' . $record->technician->name . ' el ' . $record->completed_date;
}
```

#### Calcular costo total de mantenimientos

```php
$asset = Asset::find(1);
$totalCost = $asset->maintenance()
    ->where('status', 'completed')
    ->sum('cost');

echo "Costo total de mantenimientos: $" . number_format($totalCost, 2);
```

---

### 4. Trabajar con Áreas

#### Obtener todos los activos de un área

```php
$area = Area::where('name', 'Tecnología')->first();
$areaAssets = $area->assets()->with('category', 'status')->get();

foreach ($areaAssets as $asset) {
    echo $asset->name . ' - ' . $asset->status->name;
}
```

#### Obtener responsable de un área

```php
$area = Area::find(1);
if ($area->manager) {
    echo "Responsable del área: " . $area->manager->name;
}
```

#### Contar activos por área

```php
$areaStats = Area::with('assets')->get()->map(function ($area) {
    return [
        'area' => $area->name,
        'total_assets' => $area->assets->count(),
        'active_assets' => $area->assets()->whereHas('status', function ($q) {
            $q->where('name', 'Activo');
        })->count(),
    ];
});
```

---

### 5. Trabajar con Categorías

#### Obtener estadísticas por categoría

```php
$categoryStats = Category::with('assets')->get()->map(function ($category) {
    return [
        'category' => $category->name,
        'total_assets' => $category->assets->count(),
        'total_investment' => $category->assets->sum('purchase_price'),
        'avg_investment' => $category->assets->avg('purchase_price'),
    ];
});

foreach ($categoryStats as $stat) {
    echo $stat['category'] . ': ' . $stat['total_assets'] . ' activos, Inversión: $' . number_format($stat['total_investment'], 2);
}
```

#### Obtener activos sin garantía vigente

```php
$expiredWarranty = Asset::where('category_id', 1)
    ->where('warranty_until', '<', now()->toDateString())
    ->orWhere('warranty_until', null)
    ->get();
```

---

### 6. Trabajar con Usuarios

#### Obtener áreas que administra un usuario

```php
$user = User::find(1);
$managedAreas = $user->managedAreas()->with('assets')->get();

foreach ($managedAreas as $area) {
    echo $area->name . ' - ' . $area->assets->count() . ' activos';
}
```

#### Obtener activos creados por un usuario

```php
$user = User::find(1);
$createdAssets = $user->createdAssets()->get();
```

#### Obtener auditoría de cambios hechos por un usuario

```php
$user = User::find(1);
$auditTrail = $user->auditHistory()
    ->orderBy('created_at', 'desc')
    ->with('asset')
    ->get();

foreach ($auditTrail as $entry) {
    echo $entry->action . ' en ' . $entry->asset->name . ' el ' . $entry->created_at;
}
```

---

### 7. Consultas Avanzadas

#### Obtener activos con bajo valor pero alto costo de mantenimiento

```php
$assets = Asset::with('maintenance')
    ->where('purchase_price', '<', 500)
    ->get()
    ->filter(function ($asset) {
        return $asset->maintenance()
            ->where('status', 'completed')
            ->sum('cost') > $asset->purchase_price;
    });
```

#### Obtener activos vencidos en garantía en el último año

```php
$expiredWarranty = Asset::whereBetween('warranty_until', [
    now()->subYear()->toDateString(),
    now()->toDateString()
])->with('category', 'area')->get();
```

#### Obtener resumen de estado de activos por departamento

```php
$departmentStatus = Area::with(['assets' => function ($q) {
    $q->with('status');
}])->get()->map(function ($area) {
    $assetsByStatus = $area->assets->groupBy('status.name');
    return [
        'area' => $area->name,
        'status_breakdown' => $assetsByStatus->map->count(),
    ];
});
```

#### Obtener usuarios más activos en asignaciones

```php
$activeUsers = User::withCount('madeAssignments')
    ->orderBy('made_assignments_count', 'desc')
    ->take(10)
    ->get();

foreach ($activeUsers as $user) {
    echo $user->name . ': ' . $user->made_assignments_count . ' asignaciones realizadas';
}
```

---

## 🛡️ Mejores Prácticas

### Usar Eager Loading

```php
// ❌ Evitar: Genera N+1 queries
$assets = Asset::all();
foreach ($assets as $asset) {
    echo $asset->category->name;
}

// ✅ Correcto: Una sola query con relaciones
$assets = Asset::with('category')->get();
foreach ($assets as $asset) {
    echo $asset->category->name;
}
```

### Usar Métodos Helper en Modelos

```php
// Mantener lógica en el modelo, no en el controlador
class Assignment extends Model {
    public function isActive(): bool {
        return is_null($this->returned_at);
    }
}

// Uso:
if ($assignment->isActive()) {
    // ...
}
```

### Usar Soft Deletes Correctamente

```php
// Obtener solo registros no eliminados
$categories = Category::all(); // No incluye soft-deleted

// Obtener todos incluyendo soft-deleted
$categories = Category::withTrashed()->get();

// Obtener solo soft-deleted
$categories = Category::onlyTrashed()->get();

// Restaurar soft-deleted
$category = Category::withTrashed()->find(1);
$category->restore();

// Eliminación permanente
$category->forceDelete();
```

---

## 📊 Queries Útiles para Reportes

### Reporte: Valor total de activos por categoría

```php
$report = Category::with('assets')
    ->get()
    ->map(function ($category) {
        return [
            'category' => $category->name,
            'count' => $category->assets->count(),
            'total_value' => $category->assets->sum('purchase_price'),
            'average_value' => $category->assets->avg('purchase_price'),
        ];
    });
```

### Reporte: Activos por vencer garantía

```php
$report = Asset::whereBetween('warranty_until', [
    now()->toDateString(),
    now()->addDays(30)->toDateString()
])->with('category', 'area')->get();
```

### Reporte: Mantenimientos próximos

```php
$report = Maintenance::where('status', 'pending')
    ->whereBetween('scheduled_date', [
        now()->toDateString(),
        now()->addDays(7)->toDateString()
    ])->with('asset', 'type', 'technician')->get();
```

---

**Última actualización:** 19 de enero de 2026
