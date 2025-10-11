# Configuración de Variables de Entorno en Netlify

## Variables de Entorno Requeridas

Para que el sistema EVITA funcione correctamente en producción, es necesario configurar las siguientes variables de entorno en Netlify:

### 1. Acceder a la configuración de Netlify
1. Ve a tu dashboard de Netlify
2. Selecciona el sitio `articulosdelimpiezaevita`
3. Ve a **Site settings** > **Environment variables**

### 2. Configurar las siguientes variables:

```
VITE_SUPABASE_URL=https://articulosdelimpiezaevita.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFydGljdWxvc2RlbGltcGllemFldml0YSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM5MjQ4MDAwLCJleHAiOjIwNTQ4MjQwMDB9.example
```

### 3. Reemplazar la clave anónima
**IMPORTANTE**: La clave `VITE_SUPABASE_ANON_KEY` mostrada arriba es un ejemplo. Debes reemplazarla con la clave anónima real de tu proyecto Supabase.

Para obtener la clave real:
1. Ve a tu proyecto en Supabase
2. Ve a **Settings** > **API**
3. Copia la **anon public** key
4. Reemplaza el valor en Netlify

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

