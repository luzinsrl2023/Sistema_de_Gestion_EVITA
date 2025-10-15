# Sistema de Gestión EVITA - Actualizado ✨

> **ERP moderno para gestión empresarial con Supabase Storage integrado**

## 🆕 Últimas Actualizaciones

### 🚀 Version 2.0.0 - Enero 2025

**✅ Nuevas Funcionalidades Implementadas:**

#### 📁 **Sistema de Almacenamiento Supabase Storage**
- **Buckets organizados**: Logos, facturas, documentos, productos, avatares
- **URLs públicas y privadas**: Seguridad avanzada según tipo de archivo
- **Componente FileUploader reutilizable**: Drag & drop, progreso, validación
- **Inicialización automática**: Setup automático de buckets en primera ejecución

#### 🎨 **Mejoras de Interfaz**
- **Botón de cerrar sesión mejorado**: Efectos hover, gradientes, animaciones
- **Sistema de subida de logos**: Validación, progreso en tiempo real, gestión de errores
- **Interface moderna**: Componentes pulidos y experiencia de usuario mejorada

#### 🔧 **Correcciones Críticas**
- **Error "Invalid time value" resuelto**: Función `formatDate` robusta y compatible
- **Manejo de fechas mejorado**: Soporte para múltiples formatos y timezones
- **Build de producción arreglado**: Importaciones correctas para Netlify

## 🛠️ Arquitectura del Sistema

### **Frontend** (React + Vite)
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── FileUploader.jsx     ← NUEVO: Componente de subida
│   │   │   └── Settings.jsx         ← MEJORADO: Con Supabase Storage
│   │   └── layout/
│   │       └── Layout.jsx           ← MEJORADO: Botón logout
│   ├── lib/
│   │   ├── supabaseClient.js        ← Cliente para frontend
│   │   ├── supabaseAuth.js          ← Cliente para autenticación  
│   │   ├── supabaseStorage.js       ← NUEVO: Sistema de storage
│   │   └── utils.js                 ← MEJORADO: formatDate arreglado
│   ├── services/                    ← Servicios backend actualizados
│   └── pages/                       ← Módulos del sistema
```

### **Storage con Supabase**
```
Buckets Configurados:
├── company-logos/     (público)  - Logos de empresa
├── invoices/          (privado)  - Facturas y comprobantes  
├── documents/         (privado)  - Documentos generales
├── product-images/    (público)  - Imágenes de productos
└── avatars/          (público)  - Avatares de usuarios
```

## 🚀 Guía de Uso

### **1. Subir Logo de Empresa**
1. Ve a **⚙️ Configuración** → **🏢 Empresa**
2. Sección "Logo de la empresa"
3. Arrastra imagen o haz clic en "Subir Logo"
4. Formatos: PNG, JPG, GIF, WebP (máx. 5MB)
5. El logo se almacena automáticamente en Supabase Storage

### **2. Usar Componente FileUploader**
```jsx
import FileUploader from './components/ui/FileUploader'
import { BUCKETS } from './lib/supabaseStorage'

<FileUploader
  bucketName={BUCKETS.DOCUMENTS}
  acceptedTypes={['.pdf', '.doc', '.docx']}
  maxSize={10 * 1024 * 1024}
  multiple={true}
  onFileUploaded={(fileData) => {
    console.log('Archivo subido:', fileData)
  }}
/>
```

### **3. Funciones de Storage Disponibles**
```javascript
import { 
  uploadFile, 
  deleteFile, 
  uploadLogo, 
  uploadInvoice,
  BUCKETS 
} from './lib/supabaseStorage'

// Subir archivo general
const result = await uploadFile(file, BUCKETS.DOCUMENTS, 'mi-documento.pdf')

// Subir logo específicamente
const logoResult = await uploadLogo(file, 'company-logo.png')

// Subir factura con carpeta
const invoiceResult = await uploadInvoice(file, 'factura-001.pdf', 'enero-2025')
```

## 🔧 Configuración de Desarrollo

### **Variables de Entorno**
```env
# .env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### **Instalación**
```bash
# Instalar dependencias
cd frontend
npm install

# Modo desarrollo
npm run dev

# Build para producción
npm run build
```

### **Deploy en Netlify**
1. **✅ Build arreglado**: Sin errores de importación
2. **✅ Variables configuradas**: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
3. **✅ Redirects configurados**: SPA routing funcional

## 📋 Módulos del Sistema

### **✅ Implementados y Mejorados**
- 🏠 **Dashboard**: Panel principal con métricas
- 📄 **Facturas**: Administrador de comprobantes (error fixed)
- 🏢 **Clientes**: Gestión de clientes
- 📦 **Productos**: Catálogo con imágenes
- 💰 **Cobranzas**: Cuentas corrientes y recibos
- 📊 **Reportes**: Ventas, compras, stock
- ⚙️ **Configuración**: Con Supabase Storage integrado

### **🔄 En Desarrollo**
- 🛒 **Órdenes de Compra**: Gestión de proveedores
- 💳 **Cotizaciones**: Sistema de presupuestos
- 📈 **Analytics**: Dashboards avanzados

## 🔐 Seguridad

### **Autenticación**
- Login con Supabase Auth
- Políticas RLS configuradas
- Sesiones seguras

### **Storage**
- **Buckets públicos**: URLs directas (logos, productos)
- **Buckets privados**: URLs firmadas con expiración
- **Validación**: Tipos y tamaños de archivo
- **Limpieza**: Eliminación automática de archivos huérfanos

## 🎯 Características Destacadas

### **🚀 Rendimiento**
- Build optimizado (3.08MB gzipped)
- Lazy loading implementado
- Cache de assets eficiente

### **🎨 UI/UX**
- Diseño oscuro profesional
- Componentes reutilizables
- Animaciones suaves
- Responsive design

### **📱 Compatibilidad**
- ✅ Desktop completo
- ✅ Tablet adaptativo  
- ✅ Mobile responsive

## 🐛 Problemas Resueltos

### **✅ Error "Invalid time value"**
- **Problema**: Facturas mostraban error al formatear fechas
- **Solución**: Función `formatDate` robusta con múltiples validaciones
- **Ubicación**: `src/lib/utils.js`

### **✅ Error de Deploy en Netlify**
- **Problema**: Importación incorrecta en `supabaseStorage.js`
- **Solución**: Usar `supabaseClient` en lugar de `supabaseAuth`
- **Estado**: ✅ Build exitoso

### **✅ Botón de Logout**
- **Problema**: Diseño básico sin efectos
- **Solución**: Gradientes, animaciones, efectos hover
- **Resultado**: Interface moderna y atractiva

## Problemas Comunes y Soluciones

### Error al guardar cotización: Usuario no autenticado

**Problema**: Los usuarios reciben el mensaje "Usuario no autenticado" al intentar guardar cotizaciones, excepto para `test@example.com`.

**Causa**: Las políticas RLS (Row Level Security) de la tabla `cotizaciones` fueron configuradas incorrectamente, requiriendo autenticación de Supabase en lugar de permitir el sistema de autenticación personalizado de la aplicación.

**Solución**: Se creó una nueva migración (`0020_fix_cotizaciones_rls_app_auth.sql`) que:
1. Permite operaciones CRUD en la tabla `cotizaciones` para usuarios anónimos (app-auth)
2. Mantiene las políticas para usuarios autenticados de Supabase
3. Corrige la función `get_cotizaciones_stats` para funcionar sin `auth.uid()`

**Para aplicar la solución**:
1. Ejecutar `supabase migration up` para aplicar la nueva migración
2. O ejecutar el script `commit-fixes.ps1` que hará commit y push de los cambios

## 📚 Documentación Adicional

- 📁 **[SUPABASE_STORAGE.md](./SUPABASE_STORAGE.md)**: Guía completa de Storage
- 🔧 **[netlify.toml](./netlify.toml)**: Configuración de deploy
- 📝 **[frontend/.env.example](./frontend/.env.example)**: Variables de entorno

## 🤝 Contribución

1. Fork del repositorio
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'feat: nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Pull Request

## 📞 Soporte

- **Repositorio**: https://github.com/luzinsrl2023/Sistema_de_Gestion_EVITA.git
- **Deploy**: https://app.netlify.com/
- **Documentación**: Ver archivos `.md` en el repo

---

**🎉 Sistema totalmente funcional y listo para producción**

**Versión**: 2.0.0  
**Última actualización**: Enero 2025  
**Estado**: ✅ Deploy exitoso  
**Supabase Storage**: ✅ Operativo  
**Build**: ✅ Sin errores