# Configuración de Variables de Entorno en Netlify

## Variables de Entorno Requeridas

Para que el sistema EVITA funcione correctamente en producción, es necesario configurar las siguientes variables de entorno en Netlify:

### 1. Acceder a la configuración de Netlify
1. Ve a tu dashboard de Netlify
2. Selecciona el sitio `articulosdelimpiezaevita`
3. Ve a **Site settings** > **Environment variables**

### 2. Configurar las siguientes variables:

**CRÍTICO**: Estas variables deben configurarse exactamente como se muestran:

```
VITE_SUPABASE_URL=https://articulosdelimpiezaevita.supabase.co
VITE_SUPABASE_ANON_KEY=[TU_CLAVE_ANONIMA_REAL_AQUI]
```

### 3. Obtener la clave anónima real de Supabase
**PASO CRÍTICO**: La clave `VITE_SUPABASE_ANON_KEY` debe ser la clave real de tu proyecto Supabase.

Para obtener la clave real:
1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto `articulosdelimpiezaevita`
3. Ve a **Settings** > **API**
4. Copia la **anon public** key (comienza con `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
5. Reemplaza `[TU_CLAVE_ANONIMA_REAL_AQUI]` en Netlify con esta clave

### 4. Verificar que las variables estén configuradas
Después de configurar las variables, verifica que aparezcan en:
- Netlify Dashboard > Site Settings > Environment Variables
- Deben mostrar exactamente los nombres: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

### 4. Redesplegar
Después de configurar las variables de entorno:
1. Ve a **Deploys** en tu dashboard de Netlify
2. Haz clic en **Trigger deploy** > **Deploy site**

## Verificación

Una vez configuradas las variables y redesplegado el sitio, verifica que:
1. El login funciona correctamente
2. Los módulos de Ventas, Compras, Cobranzas y Reportes cargan sin errores
3. No aparecen errores "Failed to fetch" en la consola del navegador

## Notas Importantes

- Las variables de entorno solo se aplican después de un nuevo despliegue
- Los cambios en las variables de entorno requieren un rebuild completo del sitio
- Asegúrate de que las variables estén configuradas para el entorno de producción

