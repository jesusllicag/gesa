# 📋 Migraciones y Estructura de BD - Sistema GESA

## ✅ Resumen de Implementación

Se ha creado exitosamente la estructura completa de base de datos para el sistema GESA de control y seguimiento de activos. Todas las migraciones se han ejecutado correctamente.

---

## 📊 Tablas Creadas

### Tablas Solicitadas:

| #   | Tabla           | Descripción                | Registros Base |
| --- | --------------- | -------------------------- | -------------- |
| 1   | **categories**  | Categorías de activos      | 6              |
| 2   | **areas**       | Departamentos/Áreas        | 5              |
| 3   | **assets**      | Activos principales        | Vacía          |
| 4   | **assignments** | Asignaciones de activos    | Vacía          |
| 5   | **maintenance** | Registros de mantenimiento | Vacía          |

### Tablas Adicionales Recomendadas:

| #   | Tabla                 | Descripción            | Razón                                                               |
| --- | --------------------- | ---------------------- | ------------------------------------------------------------------- |
| 6   | **asset_statuses**    | Estados de activos     | Normalización - Control de estados (Activo, En Mantenimiento, etc.) |
| 7   | **maintenance_types** | Tipos de mantenimiento | Normalización - Categorización (Preventivo, Correctivo, etc.)       |
| 8   | **asset_histories**   | Auditoría de cambios   | Trazabilidad - Rastrear cambios en activos para compliance          |

---

## 🗂️ Relaciones Entre Tablas

```
┌─────────┐
│ users   │
└────┬────┘
     │
     ├──→ areas.manager_id
     ├──→ assets.created_by
     ├──→ assignments.user_id
     ├──→ assignments.assigned_by
     ├──→ maintenance.technician_id
     └──→ asset_histories.user_id

┌──────────────┐
│ categories   │
└────┬─────────┘
     └──→ assets.category_id

┌─────────┐
│ areas   │
└────┬────┘
     ├──→ assets.area_id
     └──→ assignments.area_id

┌─────────────────┐
│ asset_statuses  │
└────┬────────────┘
     └──→ assets.status_id

┌────────┐
│ assets │
└────┬───┘
     ├──→ assignments.asset_id
     ├──→ maintenance.asset_id
     └──→ asset_histories.asset_id

┌──────────────────┐
│ maintenance_types│
└────┬─────────────┘
     └──→ maintenance.maintenance_type_id
```

---

## 📁 Archivos Creados

### Migraciones (8 archivos)

```
database/migrations/
├── 2026_01_20_015640_create_categories_table.php
├── 2026_01_20_015659_create_areas_table.php
├── 2026_01_20_015715_create_asset_statuses_table.php
├── 2026_01_20_015729_create_assets_table.php
├── 2026_01_20_015743_create_assignments_table.php
├── 2026_01_20_015815_create_maintenance_types_table.php
├── 2026_01_20_015830_create_maintenance_table.php
└── 2026_01_20_015921_create_asset_histories_table.php
```

### Modelos Eloquent (8 archivos)

```
app/Models/
├── Category.php
├── Area.php
├── AssetStatus.php
├── Asset.php
├── Assignment.php
├── MaintenanceType.php
├── Maintenance.php
└── AssetHistory.php
```

### Seeders (4 archivos)

```
database/seeders/
├── AssetStatusSeeder.php     (5 estados predeterminados)
├── MaintenanceTypeSeeder.php (4 tipos de mantenimiento)
├── CategorySeeder.php        (6 categorías de activos)
└── AreaSeeder.php            (5 departamentos)
```

---

## 📋 Detalle de Campos por Tabla

### **categories** (Categorías)

- `id` - Identificador único
- `name` - Nombre único
- `code` - Código de referencia
- `description` - Descripción
- `deleted_at` - Soft delete
- `timestamps` - Fecha de creación/actualización

**Datos de ejemplo:**

- Equipos de Cómputo (EQC)
- Muebles (MUE)
- Electrónica (ELE)
- Maquinaria (MAQ)
- Herramientas (HER)
- Vehículos (VEH)

---

### **areas** (Áreas/Departamentos)

- `id` - Identificador único
- `name` - Nombre único
- `location` - Ubicación física
- `description` - Descripción
- `manager_id` - FK a usuarios (responsable)
- `deleted_at` - Soft delete
- `timestamps` - Fecha de creación/actualización

**Datos de ejemplo:**

- Administración (Piso 1)
- Tecnología (Piso 2)
- Recursos Humanos (Piso 1)
- Operaciones (Piso 3)
- Almacén (Sótano)

---

### **asset_statuses** (Estados de Activos)

- `id` - Identificador único
- `name` - Nombre único del estado
- `description` - Descripción
- `color` - Color hexadecimal para UI
- `is_active` - Indica si está activo
- `timestamps` - Fecha de creación/actualización

**Datos de ejemplo:**

- Activo (#10B981 - Verde)
- Inactivo (#6B7280 - Gris)
- En Mantenimiento (#F59E0B - Amarillo)
- En Reparación (#EF4444 - Rojo)
- Desechado (#8B5CF6 - Púrpura)

---

### **assets** (Activos)

- `id` - Identificador único
- `code` - Código único del activo
- `name` - Nombre del activo
- `description` - Descripción detallada
- `category_id` - FK a categorías
- `area_id` - FK a áreas
- `status_id` - FK a estados de activos
- `purchase_price` - Precio de compra (decimal)
- `purchase_date` - Fecha de compra
- `warranty_until` - Vencimiento de garantía
- `model` - Modelo del activo
- `serial_number` - Número de serie
- `notes` - Notas adicionales
- `created_by` - FK a usuario que creó
- `deleted_at` - Soft delete
- `timestamps` - Fecha de creación/actualización

---

### **assignments** (Asignaciones)

- `id` - Identificador único
- `asset_id` - FK a activos
- `user_id` - FK a usuarios responsables
- `area_id` - FK a áreas
- `assigned_at` - Fecha de asignación
- `returned_at` - Fecha de devolución (nullable)
- `notes` - Notas sobre la asignación
- `assigned_by` - FK a usuario que asignó
- `timestamps` - Fecha de creación/actualización

**Características:**

- Constraint único: `(asset_id, returned_at)` - Un activo solo tiene una asignación activa
- `returned_at = NULL` indica asignación vigente

---

### **maintenance_types** (Tipos de Mantenimiento)

- `id` - Identificador único
- `name` - Nombre único del tipo
- `description` - Descripción
- `timestamps` - Fecha de creación/actualización

**Datos de ejemplo:**

- Preventivo
- Correctivo
- Inspección
- Calibración

---

### **maintenance** (Registros de Mantenimiento)

- `id` - Identificador único
- `asset_id` - FK a activos
- `maintenance_type_id` - FK a tipos de mantenimiento
- `scheduled_date` - Fecha programada
- `completed_date` - Fecha de completación (nullable)
- `description` - Descripción del trabajo
- `findings` - Hallazgos encontrados
- `actions_taken` - Acciones ejecutadas
- `cost` - Costo del mantenimiento (decimal)
- `technician_id` - FK a usuarios (técnico)
- `status` - Estado: 'pending', 'completed', 'cancelled'
- `timestamps` - Fecha de creación/actualización

---

### **asset_histories** (Auditoría)

- `id` - Identificador único
- `asset_id` - FK a activos
- `action` - Tipo: 'create', 'update', 'delete'
- `field` - Campo modificado
- `old_value` - Valor anterior
- `new_value` - Valor nuevo
- `user_id` - FK a usuario que realizó cambio
- `ip_address` - IP del usuario
- `user_agent` - Agente del navegador
- `created_at` - Timestamp del cambio

---

## 🔄 Comandos Útiles

### Ejecutar migraciones

```bash
# Ejecutar todas las migraciones pendientes
php artisan migrate

# Resetear y ejecutar desde cero sin seeders
php artisan migrate:refresh

# Resetear y ejecutar con seeders
php artisan migrate:fresh --seed

# Ver estado de migraciones
php artisan migrate:status
```

### Ejecutar seeders

```bash
# Ejecutar todos los seeders
php artisan db:seed

# Ejecutar seeder específico
php artisan db:seed --class=AssetStatusSeeder

# Resetear DB y ejecutar seeders
php artisan migrate:fresh --seed
```

### Rollback

```bash
# Revertir última migración
php artisan migrate:rollback

# Revertir todas las migraciones
php artisan migrate:reset
```

---

## 📝 Modelos Eloquent - Relaciones Disponibles

### Model: **Asset**

```php
$asset->category();              // BelongsTo Category
$asset->area();                  // BelongsTo Area
$asset->status();                // BelongsTo AssetStatus
$asset->creator();               // BelongsTo User
$asset->assignments();           // HasMany Assignment
$asset->currentAssignment();     // HasOne Assignment (activa)
$asset->maintenance();           // HasMany Maintenance
$asset->histories();             // HasMany AssetHistory
```

### Model: **Assignment**

```php
$assignment->asset();            // BelongsTo Asset
$assignment->user();             // BelongsTo User
$assignment->area();             // BelongsTo Area
$assignment->assignedBy();       // BelongsTo User
$assignment->isActive();         // Método helper
```

### Model: **Maintenance**

```php
$maintenance->asset();           // BelongsTo Asset
$maintenance->type();            // BelongsTo MaintenanceType
$maintenance->technician();      // BelongsTo User
$maintenance->isCompleted();     // Método helper
```

### Model: **User**

```php
$user->managedAreas();           // HasMany Area
$user->createdAssets();          // HasMany Asset
$user->assignments();            // HasMany Assignment
$user->madeAssignments();        // HasMany Assignment
$user->maintenanceRecords();     // HasMany Maintenance
$user->auditHistory();           // HasMany AssetHistory
```

---

## ✨ Características Implementadas

✅ **Soft Deletes** - Recuperación de datos eliminados (categories, areas, assets)

✅ **Foreign Key Constraints** - Integridad referencial

- Cascade Delete para datos relacionados
- Restrict Delete para proteger datos críticos

✅ **Unique Constraints** - Prevención de duplicados

✅ **Auditoría Completa** - Rastreo de todos los cambios

✅ **Datos de Referencia** - Seeders con valores por defecto

✅ **Relaciones Eloquent** - Todas configuradas y documentadas

---

## 🚀 Próximos Pasos

1. **Crear Controladores**

    ```bash
    php artisan make:controller AssetController --resource
    php artisan make:controller AssignmentController --resource
    # ... etc
    ```

2. **Crear Requests de Validación**

    ```bash
    php artisan make:request StoreAssetRequest
    php artisan make:request UpdateAssetRequest
    # ... etc
    ```

3. **Crear Rutas API**
    - Definir endpoints RESTful en `routes/api.php`

4. **Crear Componentes React/Inertia**
    - Interfaz para crear, editar, listar activos
    - Dashboard de control

5. **Implementar Pruebas**
    - Tests unitarios
    - Tests de integración

---

## 📖 Documentación

Para más detalles sobre la estructura de base de datos, consulta:

- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Documentación completa de esquema

---

**Creado:** 19 de enero de 2026
**Estado:** ✅ Completo y Funcional
