<!-- ARCHITECTURE DIAGRAM: Asset Management System Database Schema -->

# 🏗️ Arquitectura de Base de Datos - Sistema GESA

## Diagrama de Relaciones

```
┌─────────────────────────────────────────────────────────────────┐
│                     SISTEMA GESA v1.0                           │
│            Control y Seguimiento de Activos                      │
└─────────────────────────────────────────────────────────────────┘

                            ┌─────────────┐
                            │    USERS    │
                            │             │
                            │ • name      │
                            │ • email     │
                            │ • password  │
                            └──────┬──────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
              manages        creates         performs
              areas          assets          maintenance
                    │              │              │
        ┌───────────┴─────┐        │              │
        │                 │        │              │
        ▼                 ▼        ▼              ▼
    ┌────────┐      ┌──────────┐  │           ┌──────────┐
    │ AREAS  │◄─────│ ASSETS   │──┤           │MAINTENANCE
    │        │      │          │  │           │          │
    │ • name │      │ • code   │  │           │ • status │
    │ • location    │ • name   │  │           │ • cost   │
    │ • manager_id  │ • status_id◄┤           │ • date   │
    └────────┘      └──────────┘  │           └──────────┘
        │                │         │              │
        │                │         │              │
        │                └─────────┼──────────────┘
        │                          │
        ▼                          ▼
    ┌──────────────┐      ┌─────────────────┐
    │ ASSIGNMENTS  │      │ ASSET_STATUSES  │
    │              │      │                 │
    │ • asset_id   │      │ • name          │
    │ • user_id    │      │ • color         │
    │ • assigned_at│      │ • is_active     │
    │ • returned_at│      └─────────────────┘
    └──────────────┘

    Otras relaciones:
    ┌──────────────┐      ┌────────────┐    ┌──────────────────┐
    │ CATEGORIES   │      │MAINTENANCE │    │ ASSET_HISTORIES  │
    │              │      │   TYPES    │    │ (AUDITORÍA)      │
    │ • name       │      │            │    │                  │
    │ • code       │      │ • name     │    │ • action         │
    │ • description│      │ • description   │ • field          │
    └──────────────┘      └────────────┘    │ • old_value      │
           ▲                                 │ • new_value      │
           │                                 │ • user_id        │
           └─────────────────────────────────┴──────────────────┘
                 (Todas las tablas tienen timestamps)
```

---

## 📋 Resumen de Tablas

### 1️⃣ **CATEGORIES** - Categorías de Activos

```
┌─────────────────────────────────────────┐
│ Equipos de Cómputo │ Muebles │ Electrónica
│ Maquinaria │ Herramientas │ Vehículos
└─────────────────────────────────────────┘
        ↓
   6 categorías con código único
```

### 2️⃣ **AREAS** - Departamentos/Ubicaciones

```
┌──────────────────────────────────────────┐
│ Administración │ Tecnología │ RRHH
│ Operaciones │ Almacén
└──────────────────────────────────────────┘
        ↓
   5 áreas con gestor asignado
```

### 3️⃣ **ASSET_STATUSES** - Estados de Activos

```
┌────────────────────────────────────────┐
│ ● Activo (Verde) │ ● Inactivo (Gris)
│ ● En Mantenimiento (Amarillo) │ ● En Reparación (Rojo)
│ ● Desechado (Púrpura)
└────────────────────────────────────────┘
        ↓
   5 estados con color para UI
```

### 4️⃣ **ASSETS** - Activos (Tabla Principal)

```
┌─────────────────────────────────────────────────┐
│ Código │ Nombre │ Descripción │ Categoría
│ Área │ Estado │ Precio │ Fecha Compra
│ Garantía │ Modelo │ Serie │ Notas
└─────────────────────────────────────────────────┘
        ↓
   Tabla central con todas las propiedades del activo
   Soft delete para recuperación de datos
```

### 5️⃣ **ASSIGNMENTS** - Asignaciones a Usuarios

```
┌──────────────────────────────────────────────┐
│ Activo │ Usuario │ Área
│ Fecha Asignación │ Fecha Devolución (nullable)
│ Notas │ Asignado por
└──────────────────────────────────────────────┘
        ↓
   Rastreo de quién tiene cada activo
   Mantiene historial de asignaciones pasadas
```

### 6️⃣ **MAINTENANCE_TYPES** - Tipos de Mantenimiento

```
┌──────────────────────────────────┐
│ Preventivo │ Correctivo
│ Inspección │ Calibración
└──────────────────────────────────┘
        ↓
   Categorización de tipos de trabajo
```

### 7️⃣ **MAINTENANCE** - Registros de Mantenimiento

```
┌────────────────────────────────────────────────────┐
│ Activo │ Tipo │ Fecha Programada │ Fecha Completada
│ Descripción │ Hallazgos │ Acciones Realizadas
│ Costo │ Técnico │ Estado
└────────────────────────────────────────────────────┘
        ↓
   Historial completo de mantenimientos realizados
```

### 8️⃣ **ASSET_HISTORIES** - Auditoría

```
┌─────────────────────────────────────────┐
│ Activo │ Acción (create/update/delete)
│ Campo Modificado │ Valor Anterior → Nuevo
│ Usuario │ IP │ User Agent
└─────────────────────────────────────────┘
        ↓
   Trazabilidad completa de cambios para compliance
```

---

## 🔗 Relaciones Importantes

### Assets (Activos) conecta con:

- ✅ Categories (1:N) - Cada activo pertenece a UNA categoría
- ✅ Areas (1:N) - Cada activo está en UN área
- ✅ AssetStatuses (1:N) - Cada activo tiene UN estado
- ✅ Users (1:N) - Creado por UN usuario
- ✅ Assignments (1:N) - Puede tener MUCHAS asignaciones
- ✅ Maintenance (1:N) - Puede tener MUCHOS mantenimientos
- ✅ AssetHistories (1:N) - MUCHOS registros de auditoría

### Users conecta con:

- ✅ Areas (1:N) - Puede gestionar MUCHAS áreas
- ✅ Assets (1:N) - Puede crear MUCHOS activos
- ✅ Assignments (1:N) - Puede recibir MUCHAS asignaciones
- ✅ Maintenance (1:N) - Puede realizar MUCHOS mantenimientos
- ✅ AssetHistories (1:N) - Hace MUCHOS cambios

---

## 📊 Flujos de Datos Principales

### Flujo 1: Crear y Asignar un Activo

```
Usuario → Crea Asset
    ↓
Asset creado en ASSETS con:
  - category_id (FK)
  - area_id (FK)
  - status_id = "Activo" (FK)
  - created_by = usuario_id (FK)
    ↓
Se registra en ASSET_HISTORIES
    ↓
Usuario asigna a persona en ASSIGNMENTS:
  - asset_id (FK)
  - user_id (FK)
  - area_id (FK)
  - assigned_by = usuario_id (FK)
    ↓
¡Activo ya disponible para usar!
```

### Flujo 2: Programar Mantenimiento

```
Activo requiere mantenimiento
    ↓
Crear en MAINTENANCE:
  - asset_id (FK)
  - maintenance_type_id (FK)
  - scheduled_date = fecha futura
  - status = "pending"
    ↓
Cuando se completa:
  - completed_date = hoy
  - findings = hallazgos
  - actions_taken = acciones
  - cost = costo
  - status = "completed"
    ↓
Se registra en ASSET_HISTORIES
    ↓
¡Registro de mantenimiento completado!
```

### Flujo 3: Auditoría de Cambios

```
Cualquier cambio en Asset (create/update/delete)
    ↓
Se registra automáticamente en ASSET_HISTORIES:
  - action: "create" o "update" o "delete"
  - field: nombre del campo
  - old_value: valor anterior
  - new_value: valor nuevo
  - user_id: quién hizo el cambio
  - ip_address: de dónde
  - user_agent: qué navegador
    ↓
¡Auditoría completa disponible!
```

---

## 🚀 Comandos Para Comenzar

```bash
# Ejecutar migraciones con datos de ejemplo
php artisan migrate:fresh --seed

# Ver estado de migraciones
php artisan migrate:status

# Ejecutar seeders nuevamente
php artisan db:seed

# Abrir Tinker para pruebas
php artisan tinker
```

---

## 💾 Base de Datos Ejecutada

✅ **8 Tablas creadas**
✅ **4 Seeders con datos de referencia**
✅ **8 Modelos Eloquent configurados**
✅ **Todas las relaciones configuradas**
✅ **Soft deletes implementados**
✅ **Auditoría de cambios lista**

---

## 📚 Documentación Disponible

- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Esquema detallado
- [MIGRACIONES.md](MIGRACIONES.md) - Guía de migraciones
- [EJEMPLOS_USO.md](EJEMPLOS_USO.md) - Ejemplos de código

---

## ✨ ¿Qué es lo siguiente?

1. **Crear Controladores** - Para operaciones CRUD
2. **Crear Validaciones** - Form Requests
3. **Implementar Rutas API** - Endpoints REST
4. **Crear Componentes React** - Con Inertia.js
5. **Agregar Tests** - Unitarios e integración

---

**Sistema GESA** | Actualizado: 19 de enero de 2026 | Estado: ✅ Operativo
