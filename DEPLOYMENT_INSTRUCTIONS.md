# Instrucciones de Despliegue - Sistema EVITA

## 📋 Migraciones de Base de Datos

Para activar todas las nuevas funcionalidades, ejecuta las siguientes migraciones en Supabase en orden:

### 1. Categorías y Búsqueda Avanzada
```sql
-- Ejecutar: supabase/migrations/0007_productos_categorias_search.sql
```
**Funcionalidades:**
- Tabla `categorias` con 8 categorías iniciales
- Campos `categoria_id`, `sku`, `margen`, `precio_final` en productos
- Índices de trigramas para búsqueda fuzzy
- Función `buscar_productos()` optimizada
- Funciones de actualización de precios

### 2. Sistema de Cotizaciones
```sql
-- Ejecutar: supabase/migrations/0008_cotizaciones_table.sql
```
**Funcionalidades:**
- Campos adicionales en tabla `cotizaciones`: código, cliente_nombre, cliente_email, validez_dias, notas, subtotal, iva, items (JSONB)
- Función `get_cotizaciones()` para búsqueda con filtros
- Función `get_cotizaciones_stats()` para estadísticas
- Políticas RLS configuradas

### 3. Historial de Cambios de Precios
```sql
-- Ejecutar: supabase/migrations/0009_historial_precios.sql
```
**Funcionalidades:**
- Tabla `historial_precios` para auditoría completa
- Función `actualizar_precios_proveedor_con_historial()` que:
  - Actualiza precios de productos
  - Registra usuario, fecha, porcentaje
  - Calcula promedios antes/después
  - Previene dobles incrementos
- Función `get_historial_precios()` para consultar historial

## 🎨 Nuevas Funcionalidades en la Interfaz

### Módulo de Cotizaciones
- **Ruta:** `/cotizaciones`
- **Mejoras:**
  - Interfaz más compacta (reducción de espaciado)
  - Resumen de totales movido al final
  - Botón Guardar funcional (guarda en Supabase)
  - Botón PDF funcional (genera documento)
  - Búsqueda avanzada con filtros

### Cotizaciones Generadas
- **Ruta:** `/cotizaciones-generadas`
- **Funcionalidades:**
  - Ver todas las cotizaciones guardadas
  - Descargar PDF de cualquier cotización
  - Eliminar cotizaciones
  - Estadísticas del mes
  - Búsqueda por ID, cliente o notas

### Historial de Precios
- **Ruta:** `/compras/historial-precios`
- **Funcionalidades:**
  - Timeline visual de todos los cambios
  - Filtro por proveedor
  - Información detallada:
    - Usuario que realizó el cambio
    - Fecha y hora exacta
    - Porcentaje aplicado
    - Productos afectados
    - Precios promedio antes/después

### Actualización de Precios por Proveedor
- **Ubicación:** Módulo de Proveedores
- **Botón:** "Actualizar Precios por Proveedor" (amarillo)
- **Funcionalidades:**
  - Seleccionar proveedor
  - Ingresar porcentaje de aumento
  - Actualización automática de todos los productos
  - Registro en historial con usuario y fecha
  - Prevención de dobles incrementos

## 🔒 Restricciones de Acceso

### Usuario de Prueba (test@example.com)
- **Bloqueado:** Módulo de Prospectos
- **Mensaje:** "El módulo de Prospectos no está disponible para usuarios de prueba"

## 📊 Integración con Facturador

Las cotizaciones guardadas ahora son buscables desde el módulo de Facturador mediante:
- Campo de búsqueda por ID de cotización (ej: COT-000001)
- Integración automática con la base de datos

## 🚀 Pasos para Activar

1. **Ejecutar migraciones en Supabase:**
   - Ir al panel de Supabase
   - SQL Editor
   - Ejecutar cada migración en orden (0007, 0008, 0009)

2. **Verificar en Netlify:**
   - El código ya está desplegado en main
   - Netlify construirá automáticamente
   - Verificar que no haya errores de build

3. **Probar funcionalidades:**
   - Crear una cotización y guardarla
   - Actualizar precios de un proveedor
   - Verificar el historial de cambios
   - Buscar cotizaciones generadas

## ⚠️ Notas Importantes

- El historial de precios es **inmutable** - no se puede editar ni eliminar
- Cada cambio de precio queda registrado con el usuario que lo realizó
- Las cotizaciones usan un código único (COT-XXXXXX) generado automáticamente
- Los filtros de categorías ahora usan la tabla `categorias` en lugar de valores hardcodeados

## 📝 Próximos Pasos Sugeridos

1. Configurar notificaciones por email cuando se actualicen precios
2. Agregar exportación de historial de precios a Excel/PDF
3. Implementar aprobación de cambios de precios para ciertos roles
4. Agregar dashboard de análisis de cambios de precios
