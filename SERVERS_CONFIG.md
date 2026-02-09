# Configuracion de Servidores - Sistema de Precios

## Modelo de Datos

### Tabla `instance_types`
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | auto-increment | PK |
| `nombre` | string (unique) | Nombre del tipo de instancia (ej: t2.micro) |
| `familia` | string | Familia de instancia (T2, T3, M5, C5, R5) |
| `vcpus` | integer | Numero de vCPUs |
| `procesador` | string | Descripcion del procesador |
| `memoria_gb` | decimal(8,2) | Memoria base incluida en GB |
| `almacenamiento_incluido` | string (nullable) | Tipo de almacenamiento incluido |
| `rendimiento_red` | string | Rendimiento de red |
| `precio_hora` | decimal(10,4) | Precio por hora en USD (On-Demand, us-east-1) |

### Tabla `servers`
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | UUID | PK |
| `nombre` | string | Nombre del servidor |
| `region_id` | foreignId | FK a regions |
| `operating_system_id` | foreignId | FK a operating_systems |
| `image_id` | foreignId | FK a images |
| `instance_type_id` | foreignId | FK a instance_types |
| `ram_gb` | integer | RAM configurada en GB |
| `disco_gb` | integer | Almacenamiento configurado en GB |
| `disco_tipo` | enum(SSD, HDD) | Tipo de disco |
| `conexion` | enum(publica, privada) | Tipo de conexion de red |
| `clave_privada` | string (encrypted, nullable) | Clave privada para conexion privada |
| `estado` | enum(running, stopped, pending, terminated) | Estado del servidor |
| `costo_diario` | decimal(10,4) | Costo diario calculado en USD |
| `created_by` | foreignId | FK a users |

## Sistema de Precios

### Formula de Calculo del Costo Diario

```
costo_diario = costo_instancia + costo_ram_extra + costo_disco + surcharge_conexion
```

Donde:

1. **Costo de instancia**: `precio_hora * 24`
2. **Costo RAM extra**: `max(0, ram_gb - memoria_gb_instancia) * $0.005/GB/hr * 24`
3. **Costo disco**:
   - SSD: `disco_gb * ($0.08 / 30)` por dia
   - HDD: `disco_gb * ($0.045 / 30)` por dia
4. **Surcharge conexion privada**: `$1.20/dia` ($0.05/hr * 24), conexion publica = $0.00

### Precios de Instancias (On-Demand, us-east-1)

| Instancia | Familia | vCPUs | Memoria (GB) | Precio/Hora (USD) |
|-----------|---------|-------|--------------|-------------------|
| t2.nano | T2 | 1 | 0.5 | $0.0058 |
| t2.micro | T2 | 1 | 1 | $0.0116 |
| t2.small | T2 | 1 | 2 | $0.0230 |
| t2.medium | T2 | 2 | 4 | $0.0464 |
| t2.large | T2 | 2 | 8 | $0.0928 |
| t3.micro | T3 | 2 | 1 | $0.0104 |
| t3.small | T3 | 2 | 2 | $0.0208 |
| t3.medium | T3 | 2 | 4 | $0.0416 |
| t3.large | T3 | 2 | 8 | $0.0832 |
| m5.large | M5 | 2 | 8 | $0.0960 |
| m5.xlarge | M5 | 4 | 16 | $0.1920 |
| m5.2xlarge | M5 | 8 | 32 | $0.3840 |
| c5.large | C5 | 2 | 4 | $0.0850 |
| c5.xlarge | C5 | 4 | 8 | $0.1700 |
| c5.2xlarge | C5 | 8 | 16 | $0.3400 |
| r5.large | R5 | 2 | 16 | $0.1260 |
| r5.xlarge | R5 | 4 | 32 | $0.2520 |
| r5.2xlarge | R5 | 8 | 64 | $0.5040 |

## Flujo de Creacion / Edicion

### Creacion
1. El usuario configura el servidor en el formulario (instancia, RAM, disco, tipo disco, conexion)
2. El frontend muestra una previsualizacion en tiempo real del costo diario con desglose
3. Al enviar, el backend calcula `costo_diario` usando la formula y lo guarda con el servidor

### Edicion
1. Solo se pueden modificar: `ram_gb` (solo aumentar), `disco_gb` (solo aumentar), `conexion`
2. El frontend muestra el nuevo costo estimado con desglose
3. Al guardar, el backend recalcula `costo_diario` con los nuevos valores

### Archivos Clave
- `app/Models/Server.php` - Modelo con `costo_diario` en fillable y cast decimal:4
- `app/Models/InstanceType.php` - Modelo con `precio_hora` en fillable y cast decimal:4
- `app/Http/Controllers/ServerController.php` - Metodo `calcularCostoDiario()` con la formula
- `resources/js/pages/servers/index.tsx` - Funcion `calcularCostoDiario()` y componente `CostPreview`
- `database/seeders/InstanceTypeSeeder.php` - Datos de precios por instancia
