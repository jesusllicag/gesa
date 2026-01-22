# Esquema de Base de Datos - Sistema GESA

## Descripción General

Este documento describe la estructura de base de datos para el sistema GESA, un sistema web de control y seguimiento de activos empresariales desarrollado en Laravel.

---

## Tablas Principales

### 1. **categories** (Categorías)

Almacena las categorías de activos disponibles en el sistema.

| Campo         | Tipo         | Descripción                  |
| ------------- | ------------ | ---------------------------- |
| `id`          | BIGINT       | Identificador único (PK)     |
| `name`        | VARCHAR(255) | Nombre único de la categoría |
| `description` | TEXT         | Descripción detallada        |
| `code`        | VARCHAR(255) | Código único de referencia   |
| `deleted_at`  | TIMESTAMP    | Soft delete                  |
| `created_at`  | TIMESTAMP    | Fecha de creación            |
| `updated_at`  | TIMESTAMP    | Fecha de actualización       |

**Datos de Ejemplo:**

- Equipos de Cómputo (EQC)
- Muebles (MUE)
- Electrónica (ELE)
- Maquinaria (MAQ)
- Herramientas (HER)
- Vehículos (VEH)

---

### 2. **areas** (Áreas/Departamentos)

Almacena los departamentos o áreas de la empresa donde se localizan los activos.

| Campo         | Tipo         | Descripción                       |
| ------------- | ------------ | --------------------------------- |
| `id`          | BIGINT       | Identificador único (PK)          |
| `name`        | VARCHAR(255) | Nombre único del área             |
| `description` | TEXT         | Descripción                       |
| `location`    | VARCHAR(255) | Ubicación física                  |
| `manager_id`  | BIGINT       | Responsable del área (FK a users) |
| `deleted_at`  | TIMESTAMP    | Soft delete                       |
| `created_at`  | TIMESTAMP    | Fecha de creación                 |
| `updated_at`  | TIMESTAMP    | Fecha de actualización            |

**Datos de Ejemplo:**

- Administración (Piso 1)
- Tecnología (Piso 2)
- Recursos Humanos (Piso 1)
- Operaciones (Piso 3)
- Almacén (Sótano)

---

### 3. **asset_statuses** (Estados de Activos)

Catálogo de estados posibles para los activos del sistema.

| Campo         | Tipo         | Descripción                     |
| ------------- | ------------ | ------------------------------- |
| `id`          | BIGINT       | Identificador único (PK)        |
| `name`        | VARCHAR(255) | Nombre único del estado         |
| `description` | TEXT         | Descripción                     |
| `color`       | VARCHAR(7)   | Color hexadecimal para UI       |
| `is_active`   | BOOLEAN      | Indica si el estado está activo |
| `created_at`  | TIMESTAMP    | Fecha de creación               |
| `updated_at`  | TIMESTAMP    | Fecha de actualización          |

**Datos de Ejemplo:**

- Activo (#10B981 - verde)
- Inactivo (#6B7280 - gris)
- En Mantenimiento (#F59E0B - amarillo)
- En Reparación (#EF4444 - rojo)
- Desechado (#8B5CF6 - púrpura)

---

### 4. **assets** (Activos)

Tabla principal que almacena todos los activos de la empresa.

| Campo            | Tipo          | Descripción                               |
| ---------------- | ------------- | ----------------------------------------- |
| `id`             | BIGINT        | Identificador único (PK)                  |
| `code`           | VARCHAR(255)  | Código único del activo                   |
| `name`           | VARCHAR(255)  | Nombre del activo                         |
| `description`    | TEXT          | Descripción detallada                     |
| `category_id`    | BIGINT        | Categoría (FK a categories)               |
| `area_id`        | BIGINT        | Área actual (FK a areas)                  |
| `status_id`      | BIGINT        | Estado actual (FK a asset_statuses)       |
| `purchase_price` | DECIMAL(12,2) | Precio de compra                          |
| `purchase_date`  | DATE          | Fecha de compra                           |
| `warranty_until` | DATE          | Fecha de vencimiento de garantía          |
| `model`          | VARCHAR(255)  | Modelo del activo                         |
| `serial_number`  | VARCHAR(255)  | Número de serie                           |
| `notes`          | TEXT          | Notas adicionales                         |
| `created_by`     | BIGINT        | Usuario que creó el registro (FK a users) |
| `deleted_at`     | TIMESTAMP     | Soft delete                               |
| `created_at`     | TIMESTAMP     | Fecha de creación                         |
| `updated_at`     | TIMESTAMP     | Fecha de actualización                    |

**Relaciones:**

- Pertenece a una categoría
- Está ubicado en un área
- Tiene un estado
- Fue creado por un usuario

---

### 5. **assignments** (Asignaciones)

Registra la asignación de activos a usuarios o áreas, con historial de cambios.

| Campo         | Tipo      | Descripción                                    |
| ------------- | --------- | ---------------------------------------------- |
| `id`          | BIGINT    | Identificador único (PK)                       |
| `asset_id`    | BIGINT    | Activo asignado (FK a assets)                  |
| `user_id`     | BIGINT    | Usuario responsable (FK a users)               |
| `area_id`     | BIGINT    | Área asignada (FK a areas)                     |
| `assigned_at` | DATE      | Fecha de asignación                            |
| `returned_at` | DATE      | Fecha de devolución (nullable)                 |
| `notes`       | TEXT      | Notas sobre la asignación                      |
| `assigned_by` | BIGINT    | Usuario que realizó la asignación (FK a users) |
| `created_at`  | TIMESTAMP | Fecha de creación                              |
| `updated_at`  | TIMESTAMP | Fecha de actualización                         |

**Índices Únicos:**

- `unique(['asset_id', 'returned_at'])` - Asegura que un activo solo tiene una asignación activa

**Características:**

- Permite rastrear quién tiene cada activo
- Mantiene historial de asignaciones pasadas
- Null en `returned_at` indica asignación activa

---

### 6. **maintenance_types** (Tipos de Mantenimiento)

Catálogo de tipos de mantenimiento disponibles.

| Campo         | Tipo         | Descripción              |
| ------------- | ------------ | ------------------------ |
| `id`          | BIGINT       | Identificador único (PK) |
| `name`        | VARCHAR(255) | Nombre único del tipo    |
| `description` | TEXT         | Descripción              |
| `created_at`  | TIMESTAMP    | Fecha de creación        |
| `updated_at`  | TIMESTAMP    | Fecha de actualización   |

**Datos de Ejemplo:**

- Preventivo
- Correctivo
- Inspección
- Calibración

---

### 7. **maintenance** (Registros de Mantenimiento)

Almacena el historial de mantenimientos realizados a los activos.

| Campo                 | Tipo          | Descripción                                    |
| --------------------- | ------------- | ---------------------------------------------- |
| `id`                  | BIGINT        | Identificador único (PK)                       |
| `asset_id`            | BIGINT        | Activo intervenido (FK a assets)               |
| `maintenance_type_id` | BIGINT        | Tipo de mantenimiento (FK a maintenance_types) |
| `scheduled_date`      | DATE          | Fecha programada                               |
| `completed_date`      | DATE          | Fecha de completación (nullable)               |
| `description`         | TEXT          | Descripción del trabajo                        |
| `findings`            | TEXT          | Hallazgos durante el mantenimiento             |
| `actions_taken`       | TEXT          | Acciones ejecutadas                            |
| `cost`                | DECIMAL(10,2) | Costo del mantenimiento                        |
| `technician_id`       | BIGINT        | Técnico responsable (FK a users, nullable)     |
| `status`              | VARCHAR(255)  | Estado ('pending', 'completed', 'cancelled')   |
| `created_at`          | TIMESTAMP     | Fecha de creación                              |
| `updated_at`          | TIMESTAMP     | Fecha de actualización                         |

**Características:**

- Permite programar y registrar mantenimientos
- Registra hallazgos y acciones tomadas
- Rastrea costos de mantenimiento

---

### 8. **asset_histories** (Historial de Auditoría)

Tabla de auditoría para rastrear cambios en los activos.

| Campo        | Tipo         | Descripción                                |
| ------------ | ------------ | ------------------------------------------ |
| `id`         | BIGINT       | Identificador único (PK)                   |
| `asset_id`   | BIGINT       | Activo modificado (FK a assets)            |
| `action`     | VARCHAR(255) | Tipo de acción (create, update, delete)    |
| `field`      | VARCHAR(255) | Campo modificado                           |
| `old_value`  | TEXT         | Valor anterior                             |
| `new_value`  | TEXT         | Valor nuevo                                |
| `user_id`    | BIGINT       | Usuario que realizó el cambio (FK a users) |
| `ip_address` | VARCHAR(45)  | IP del usuario                             |
| `user_agent` | TEXT         | Agente del navegador                       |
| `created_at` | TIMESTAMP    | Fecha del cambio                           |

**Propósito:**

- Auditoría completa de cambios en activos
- Trazabilidad de quién, cuándo y qué cambió
- Compliance y seguridad

---

## Relaciones Entre Tablas

```
users (1)
  ├── (N) areas.manager_id
  ├── (N) assets.created_by
  ├── (N) assignments.user_id
  ├── (N) assignments.assigned_by
  ├── (N) maintenance.technician_id
  └── (N) asset_histories.user_id

categories (1)
  └── (N) assets.category_id

areas (1)
  ├── (N) assets.area_id
  └── (N) assignments.area_id

asset_statuses (1)
  └── (N) assets.status_id

assets (1)
  ├── (N) assignments.asset_id
  ├── (N) maintenance.asset_id
  └── (N) asset_histories.asset_id

maintenance_types (1)
  └── (N) maintenance.maintenance_type_id
```

---

## Migraciones Disponibles

Las siguientes migraciones han sido creadas:

1. `2026_01_20_015640_create_categories_table.php`
2. `2026_01_20_015659_create_areas_table.php`
3. `2026_01_20_015715_create_asset_statuses_table.php`
4. `2026_01_20_015729_create_assets_table.php`
5. `2026_01_20_015743_create_assignments_table.php`
6. `2026_01_20_015815_create_maintenance_types_table.php`
7. `2026_01_20_015830_create_maintenance_table.php`
8. `2026_01_20_015921_create_asset_histories_table.php`

---

## Seeders Disponibles

Los siguientes seeders están disponibles para prellenar datos de referencia:

- `AssetStatusSeeder` - Carga 5 estados predeterminados
- `MaintenanceTypeSeeder` - Carga 4 tipos de mantenimiento
- `CategorySeeder` - Carga 6 categorías de activos
- `AreaSeeder` - Carga 5 áreas/departamentos

### Ejecutar Seeders

```bash
# Ejecutar todos los seeders
php artisan db:seed

# Ejecutar seeder específico
php artisan db:seed --class=AssetStatusSeeder

# Resetear base de datos y ejecutar seeders
php artisan migrate:fresh --seed
```

---

## Cómo Ejecutar las Migraciones

```bash
# Ejecutar todas las migraciones
php artisan migrate

# Rollback de últimas migraciones
php artisan migrate:rollback

# Resetear base de datos
php artisan migrate:reset

# Resetear y ejecutar desde cero con seeders
php artisan migrate:fresh --seed
```

---

## Notas Importantes

1. **Soft Deletes**: Las tablas `categories`, `areas` y `assets` incluyen soft deletes para permitir recuperación de datos eliminados.

2. **Cascade Delete**: Los cambios en categorías, áreas y tipos de mantenimiento se propagan automáticamente a los registros relacionados.

3. **Restrict Delete**: Los cambios en usuarios y estados de activos están protegidos contra eliminación si existen referencias.

4. **Unique Constraints**:
    - `categories.name` y `categories.code` son únicos
    - `areas.name` es única
    - `asset_statuses.name` es única
    - `assets.code` es única
    - `maintenance_types.name` es única
    - `assignments` solo permite una asignación activa por activo

5. **Estados de Mantenimiento**: Los mantenimientos pueden estar en estado 'pending', 'completed', o 'cancelled'

6. **Auditoría**: La tabla `asset_histories` permite rastrear todos los cambios en los activos para compliance y análisis.

---

## Próximos Pasos

1. Crear Modelos Eloquent correspondientes
2. Crear Factories para testing
3. Crear Controladores y Rutas
4. Implementar validaciones
5. Crear Vistas/Componentes React
