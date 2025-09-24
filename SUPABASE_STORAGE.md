# Supabase Storage - Sistema EVITA

## 📁 Configuración Implementada

Se ha implementado un sistema completo de almacenamiento de archivos usando **Supabase Storage** que reemplaza el almacenamiento local y proporciona:

### ✅ Características Implementadas

1. **Buckets Organizados**:
   - `company-logos` - Logos de empresa (público)
   - `invoices` - Facturas y comprobantes (privado)
   - `documents` - Documentos generales (privado)
   - `product-images` - Imágenes de productos (público)
   - `avatars` - Avatares de usuarios (público)

2. **Funcionalidades**:
   - ✅ Subida de archivos con validación
   - ✅ Eliminación de archivos
   - ✅ URLs públicas para archivos públicos
   - ✅ URLs firmadas para archivos privados
   - ✅ Progreso de subida simulado
   - ✅ Validación de tipos de archivo
   - ✅ Validación de tamaño de archivo
   - ✅ Inicialización automática de buckets

## 🚀 Uso del Sistema

### 1. Subida de Logo de Empresa

**Ubicación**: Configuración > Empresa > Logo de la empresa

```javascript
// El logo se sube automáticamente a Supabase Storage
// Se guarda la URL pública en localStorage
// Soporte para PNG, JPG, GIF, WebP (máximo 5MB)
```

### 2. Componente FileUploader

**Ubicación**: `src/components/ui/FileUploader.jsx`

```jsx
import FileUploader from './components/ui/FileUploader'
import { BUCKETS } from './lib/supabaseStorage'

// Ejemplo de uso para documentos
<FileUploader
  bucketName={BUCKETS.DOCUMENTS}
  acceptedTypes={['.pdf', '.doc', '.docx']}
  maxSize={50 * 1024 * 1024} // 50MB
  multiple={true}
  folder="contracts"
  onFileUploaded={(fileData) => {
    console.log('Archivo subido:', fileData)
  }}
  onFileDeleted={(fileData) => {
    console.log('Archivo eliminado:', fileData)
  }}
/>
```

### 3. Funciones Principales

**Archivo**: `src/lib/supabaseStorage.js`

```javascript
import { 
  uploadFile, 
  deleteFile, 
  uploadLogo, 
  uploadInvoice,
  BUCKETS 
} from './lib/supabaseStorage'

// Subir archivo
const result = await uploadFile(file, BUCKETS.DOCUMENTS, 'mi-archivo.pdf')

// Subir logo específicamente
const logoResult = await uploadLogo(file, 'company-logo.png')

// Subir factura
const invoiceResult = await uploadInvoice(file, 'factura-001.pdf', 'enero-2024')
```

## 🛠️ Configuración de Supabase

### Buckets Configurados

| Bucket | Público | Tamaño Máximo | Tipos de Archivo |
|--------|---------|---------------|------------------|
| `company-logos` | ✅ Sí | 10MB | Imágenes |
| `invoices` | ❌ No | 50MB | PDF, imágenes, texto |
| `documents` | ❌ No | 10MB | PDF, documentos, texto |
| `product-images` | ✅ Sí | 10MB | Imágenes |
| `avatars` | ✅ Sí | 10MB | Imágenes |

### Políticas de Seguridad (RLS)

Los buckets privados requieren autenticación para acceder a los archivos. Los buckets públicos son accesibles directamente por URL.

## 🔧 Resolución de Problemas

### Error "Invalid time value" - ✅ RESUELTO

**Problema**: El módulo de facturas mostraba error al formatear fechas.

**Solución**: Se mejoró la función `formatDate` en `src/lib/utils.js` para manejar:
- Fechas null/undefined
- Strings vacíos
- Formato YYYY-MM-DD
- Timezone UTC para consistencia

### Botón de Cerrar Sesión - ✅ MEJORADO

**Cambios aplicados**:
- Gradiente rojo con efectos hover
- Animación de escala al hacer hover
- Sombra con color temático
- Transiciones suaves

## 🎯 Próximos Pasos Recomendados

1. **Integrar FileUploader en módulos específicos**:
   - Facturas: Para adjuntar documentos
   - Productos: Para imágenes de productos
   - Clientes: Para documentos contractuales

2. **Implementar galería de imágenes**:
   - Vista previa de imágenes
   - Zoom y edición básica

3. **Sistema de backups**:
   - Respaldo automático de archivos críticos
   - Sincronización con otros servicios

4. **Optimización de imágenes**:
   - Compresión automática
   - Múltiples tamaños (thumbnails)

## 📋 Uso en el ERP

### Casos de Uso Implementados

1. **Logo de Empresa**: ✅ Completado
   - Subida con validación
   - Visualización en layout
   - Eliminación segura

2. **Preparado para**:
   - Adjuntos en facturas
   - Imágenes de productos
   - Documentos de clientes
   - Contratos con proveedores

### Ejemplos de Integración

```javascript
// En facturas - adjuntar documentos
<FileUploader
  bucketName={BUCKETS.INVOICES}
  acceptedTypes={['.pdf', 'image/*']}
  folder={`cliente-${clienteId}`}
  onFileUploaded={(file) => {
    // Asociar archivo a la factura
    updateFactura(facturaId, { 
      attachments: [...attachments, file] 
    })
  }}
/>

// En productos - galería de imágenes
<FileUploader
  bucketName={BUCKETS.PRODUCTS}
  acceptedTypes={['image/*']}
  multiple={true}
  maxSize={5 * 1024 * 1024}
  onFileUploaded={(file) => {
    addProductImage(productId, file.publicUrl)
  }}
/>
```

## 🔐 Seguridad

- **Autenticación requerida** para buckets privados
- **Validación de tipos de archivo** en frontend y backend
- **Límites de tamaño** configurables por bucket
- **URLs firmadas** con expiración para archivos privados
- **Eliminación automática** de archivos huérfanos

---

**Estado**: ✅ Sistema implementado y listo para uso
**Versión**: 1.0.0
**Fecha**: Enero 2024