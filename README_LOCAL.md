# Sistema de Gestión ERP

Sistema de gestión empresarial completo con módulos de compras, inventario, ventas, cobranzas, flujo de caja y contabilidad básica.

## Estructura del Proyecto

- `frontend/` - Aplicación web React con Vite
- `ARCHIVO/` - Diseños y documentación del sistema
- `sqlite/` - Base de datos local SQLite
- `iniciar_sistema.bat` - Script para iniciar el sistema

## Requisitos

- Node.js (v16 o superior)
- Navegador web moderno

## Iniciar el Sistema

1. Ejecute el archivo `iniciar_sistema.bat`
2. El script descargará SQLite automáticamente si no está presente
3. Se creará la base de datos local
4. Se instalarán las dependencias del frontend
5. Se iniciará el servidor de desarrollo

## Acceso a la Aplicación

Una vez iniciado el sistema, acceda a la aplicación en:
http://localhost:5173

## Módulos del Sistema

1. **Compras**
   - Registro de proveedores
   - Órdenes de compra
   - Gestión de facturas de proveedores

2. **Inventario**
   - Catálogo de productos
   - Control de stock
   - Movimientos de inventario

3. **Ventas**
   - Registro de clientes
   - Facturación
   - Gestión de cobranzas

4. **Flujo de Caja**
   - Registro de ingresos y egresos
   - Conciliación bancaria

5. **Contabilidad**
   - Asientos contables básicos
   - Cuentas contables
   - Reportes financieros

## Base de Datos

El sistema utiliza SQLite como base de datos local. La estructura de la base de datos incluye:

- Proveedores
- Productos
- Órdenes de compra y sus detalles
- Movimientos de inventario
- Clientes
- Facturas de venta y sus detalles
- Pagos recibidos
- Transacciones de caja
- Cuentas contables
- Asientos contables y sus detalles

## Desarrollo

Para trabajar en el desarrollo del frontend:

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en http://localhost:5173