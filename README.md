# EVITA Artículos de Limpieza - Sistema de Gestión

## 🏢 Descripción
Sistema de Gestión Empresarial para EVITA Artículos de Limpieza, especializado en la administración de inventarios de productos de limpieza, artículos generales y electricidad.

## ✨ Características Principales
- 🧹 **Gestión de Productos de Limpieza**: Catálogo especializado en productos EVITA
- ⚡ **Artículos Eléctricos**: Control de inventario de productos eléctricos
- 📦 **Mercancía General**: Gestión de artículos diversos
- 👥 **Multi-Usuario**: Sistema diseñado para múltiples usuarios y empresas
- 📊 **Dashboard Ejecutivo**: Panel de control con KPIs específicos del negocio
- 💰 **Gestión Financiera**: Control de ventas, compras y flujo de caja

## 🔧 Configuración de Base de Datos

### Desarrollo Local con SQLite
Para pruebas locales, el sistema utiliza SQLite simulado con LocalStorage:

1. **Configuración Automática**: El sistema detecta automáticamente el modo desarrollo
2. **Credenciales Demo**:
   - Email: `admin@evita.com`
   - Contraseña: `evita123`
3. **Datos Persistentes**: Los datos se almacenan en LocalStorage del navegador

### Producción con Supabase
Para migrar a producción con Supabase:

1. **Crear Proyecto Supabase**:
   ```bash
   # Visita https://supabase.com y crea un nuevo proyecto
   ```

2. **Configurar Variables de Entorno**:
   ```bash
   # Edita el archivo .env
   VITE_USE_LOCAL_DB=false
   VITE_SUPABASE_URL=tu-url-de-supabase
   VITE_SUPABASE_ANON_KEY=tu-clave-anonima
   ```

3. **Estructura de Base de Datos Supabase**:
   ```sql
   -- Usuarios (gestionado por Supabase Auth)
   
   -- Productos
   CREATE TABLE productos (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     codigo VARCHAR(50) UNIQUE NOT NULL,
     nombre VARCHAR(200) NOT NULL,
     categoria VARCHAR(100) NOT NULL,
     stock INTEGER DEFAULT 0,
     stock_minimo INTEGER DEFAULT 0,
     precio DECIMAL(10,2) NOT NULL,
     costo DECIMAL(10,2) NOT NULL,
     activo BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Clientes
   CREATE TABLE clientes (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     nombre VARCHAR(200) NOT NULL,
     email VARCHAR(100),
     telefono VARCHAR(50),
     direccion TEXT,
     estado_pago VARCHAR(50) DEFAULT 'al_dia',
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Proveedores
   CREATE TABLE proveedores (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     nombre VARCHAR(200) NOT NULL,
     contacto VARCHAR(200),
     email VARCHAR(100),
     telefono VARCHAR(50),
     direccion TEXT,
     terminos_pago VARCHAR(100),
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Órdenes de Compra
   CREATE TABLE ordenes_compra (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     numero VARCHAR(50) UNIQUE NOT NULL,
     proveedor_id UUID REFERENCES proveedores(id),
     estado VARCHAR(50) DEFAULT 'pendiente',
     subtotal DECIMAL(12,2) DEFAULT 0,
     impuestos DECIMAL(12,2) DEFAULT 0,
     envio DECIMAL(12,2) DEFAULT 0,
     total DECIMAL(12,2) DEFAULT 0,
     notas TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Facturas
   CREATE TABLE facturas (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     numero VARCHAR(50) UNIQUE NOT NULL,
     cliente_id UUID REFERENCES clientes(id),
     estado VARCHAR(50) DEFAULT 'pendiente',
     subtotal DECIMAL(12,2) DEFAULT 0,
     impuestos DECIMAL(12,2) DEFAULT 0,
     total DECIMAL(12,2) DEFAULT 0,
     fecha_vencimiento DATE,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn

### Instalación
```bash
# Clonar repositorio
git clone <repository-url>
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

## 🎯 Funcionalidades Específicas de EVITA

### Catálogo de Productos
- **Limpieza**: Desinfectantes, detergentes, jabones especializados
- **Electricidad**: Bombillas LED, cables, enchufes
- **Artículos Generales**: Bolsas, papel higiénico, productos diversos

### Dashboard Ejecutivo
- KPIs específicos del sector limpieza
- Alertas de stock bajo automáticas
- Análisis de productos más vendidos
- Seguimiento de flujo de caja

### Gestión de Clientes
- Seguimiento de estados de pago
- Historial de compras
- Gestión de créditos

## 🔄 Migración de Datos

### De SQLite Local a Supabase
1. **Exportar Datos Locales**:
   ```javascript
   // En la consola del navegador
   console.log(JSON.stringify({
     users: JSON.parse(localStorage.getItem('evita_users')),
     products: JSON.parse(localStorage.getItem('evita_products')),
     // ... otros datos
   }))
   ```

2. **Importar a Supabase**:
   - Usar el dashboard de Supabase para insertar datos
   - O crear scripts de migración personalizados

## 🛡️ Seguridad
- Autenticación multi-factor disponible con Supabase
- Roles y permisos por usuario
- Encriptación de datos sensibles
- Backup automático con Supabase

## 📱 Tecnologías
- **Frontend**: React 18, Vite, TailwindCSS
- **Iconos**: Lucide React
- **Routing**: React Router DOM
- **Base de Datos Local**: LocalStorage (desarrollo)
- **Base de Datos Producción**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth

## 📞 Soporte
Para soporte técnico o consultas sobre el sistema EVITA, contacta al equipo de desarrollo.

## 📄 Licencia
Sistema propietario de EVITA Artículos de Limpieza.