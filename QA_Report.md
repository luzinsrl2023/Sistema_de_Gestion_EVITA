# Reporte de Análisis y Calidad del ERP "EVITA"

**Fecha:** 26 de Septiembre de 2025
**Autor:** Jules, QA Tester experto en ERP

---

## 1. Resumen Ejecutivo

El sistema de gestión "EVITA" es una aplicación web con una base técnica moderna y una arquitectura prometedora, utilizando tecnologías como React, Supabase y TailwindCSS. Su interfaz es limpia y las funcionalidades básicas de un ERP (gestión de productos, clientes, ventas) están implementadas a nivel general. El uso de Supabase para la base de datos y el almacenamiento de archivos es una elección acertada que le otorga escalabilidad.

Sin embargo, el análisis revela que el sistema, en su estado actual, **no es funcional ni viable para el mercado del norte argentino**. Carece por completo de adaptaciones críticas y obligatorias, tanto a nivel técnico como funcional. Las deficiencias más graves son la **ausencia total de integración con AFIP** para la facturación electrónica, la **falta de soporte para conectividad inestable** (modo offline), y **vulnerabilidades en el manejo de datos sensibles**.

Este reporte detalla las fallas identificadas y propone una hoja de ruta con mejoras técnicas y funcionales para alinear el producto con las necesidades y regulaciones del mercado objetivo.

---

## 2. Listado de Fallas Detectadas

A continuación, se presenta un listado de las fallas identificadas, clasificadas por severidad y con una descripción de su impacto.

### Fallas Críticas
| Falla | Descripción | Impacto Operativo |
| :--- | :--- | :--- |
| **Ausencia de Facturación Electrónica (AFIP)** | El sistema no integra los servicios web de AFIP. No puede generar facturas con CAE (Código de Autorización Electrónico), códigos de barras o QR, elementos legalmente obligatorios en Argentina. Las facturas generadas en PDF son meramente cosméticas y sin validez fiscal. | **Impide totalmente la operación comercial.** Las empresas no pueden facturar legalmente, lo que detiene las ventas y expone a sanciones graves. |
| **Inexistencia de un Modo Offline** | La aplicación requiere una conexión a internet constante para funcionar. No posee mecanismos de cache, almacenamiento local persistente (más allá de `localStorage` para configuraciones básicas) o sincronización de datos para operar en zonas con conectividad rural o intermitente. | **Inutiliza el sistema en el 80% del norte argentino.** Los usuarios no podrán trabajar de manera continua, perdiendo datos y productividad en cada corte de conexión. |

### Fallas de Severidad Alta
| Falla | Descripción | Impacto Operativo |
| :--- | :--- | :--- |
| **Almacenamiento Inseguro de Datos Sensibles** | Datos críticos de la empresa, como el CUIT, se guardan directamente en `localStorage`. Esta información es fácilmente accesible desde el navegador y no es una práctica segura para datos sensibles, especialmente en un entorno multi-usuario. | **Riesgo de seguridad alto.** Expone datos fiscales de la empresa a posibles robos de información o manipulaciones no autorizadas. No cumple con estándares mínimos de seguridad de datos. |
| **Falta de Soporte para Impuestos y Retenciones Locales** | El sistema calcula un único impuesto (IVA al 21% de forma fija) y no contempla retenciones ni percepciones (IVA, Ganancias, Ingresos Brutos), que son fundamentales en la contabilidad argentina. | **Cálculos incorrectos y problemas contables graves.** La empresa no puede calcular correctamente los montos a pagar o cobrar, generando discrepancias fiscales y financieras. |
| **Subida de Archivos no Resiliente** | El componente de subida de archivos no tiene reintentos automáticos en caso de fallo de red. El progreso de subida es simulado, no real, lo que engaña al usuario sobre el estado de la carga, especialmente con archivos grandes. | **Pérdida de documentos y frustración del usuario.** En redes inestables, la subida de facturas, logos o documentos fallará constantemente sin posibilidad de recuperación, afectando la integridad de los datos. |

### Fallas de Severidad Media
| Falla | Descripción | Impacto Operativo |
| :--- | :--- | :--- |
| **Inconsistencia en el Código y Componentes No Reutilizados** | La lógica para subir el logo de la empresa en `Settings.jsx` está duplicada y no utiliza el componente reutilizable `FileUploader.jsx`. Esto genera inconsistencias y dificulta el mantenimiento. | **Aumenta la deuda técnica.** Dificulta la corrección de errores (hay que arreglarlo en dos lugares) y la implementación de nuevas funcionalidades, haciendo el sistema más frágil. |
| **Falta de Adaptación Cultural y Lingüística** | El sistema utiliza términos genéricos ("invoice", "order") y no incorpora modismos o lenguaje común en el ámbito pyme y cooperativo del norte argentino (ej: "remito", "cuenta corriente", "orden de pago"). | **Menor adopción y usabilidad.** Los usuarios pueden sentir el sistema ajeno y complejo, lo que reduce la velocidad de aprendizaje y la eficiencia en el uso diario. |

---

## 3. Posibles Mejoras y Optimizaciones

### Mejoras Técnicas
1.  **Integración con Webservices de AFIP:**
    *   Implementar un módulo backend que se comunique con los servicios de AFIP (WSAA, WSFE) para solicitar CAE, validar comprobantes y generar los QR fiscales.
    *   Utilizar librerías validadas para la facturación electrónica en Argentina.
2.  **Implementación de un Service Worker y PWA (Progressive Web App):**
    *   Convertir la aplicación en una PWA para permitir su "instalación" en dispositivos y habilitar un modo de funcionamiento offline.
    *   Utilizar un Service Worker para cachear los recursos de la aplicación y los datos más importantes.
3.  **Sistema de Sincronización y Almacenamiento Local Robusto:**
    *   Reemplazar el uso de `localStorage` para datos transaccionales por `IndexedDB`.
    *   Diseñar una cola de sincronización que detecte cuando el usuario está online para enviar los datos generados offline al servidor (Supabase).
4.  **Refactorización del Frontend:**
    *   Eliminar la lógica de subida de archivos duplicada en `Settings.jsx` y usar el componente `FileUploader.jsx`.
    *   Mejorar `FileUploader.jsx` para que muestre un progreso de subida real y tenga una lógica de reintentos con backoff exponencial.
5.  **Seguridad de Datos:**
    *   Mover los datos sensibles de la empresa (`CUIT`, etc.) de `localStorage` a una tabla segura en la base de datos de Supabase, con políticas de acceso (RLS) adecuadas.

### Mejoras Funcionales
1.  **Ampliación del Esquema de la Base de Datos:**
    *   Modificar las tablas `facturas` y `productos` para incluir campos para diferentes tipos de IVA, percepciones y retenciones.
    *   Añadir una tabla para gestionar los tipos de comprobante (Factura A, B, C, Remito, etc.) según la normativa de AFIP.
2.  **Adaptación de la Interfaz de Usuario (UI):**
    *   Ajustar los formularios de facturación para que reflejen los campos requeridos por AFIP.
    *   Modificar el lenguaje en toda la aplicación para usar terminología local y familiar para los usuarios del norte argentino.
3.  **Plantillas de PDF Fiscalmente Válidas:**
    *   Rediseñar las plantillas de PDF generadas por `jspdf` para que cumplan con el formato oficial de AFIP, incluyendo el logo, CAE, fecha de vencimiento del CAE y el código QR.
4.  **Adaptación a Rubros Específicos:**
    *   Considerar la creación de módulos o configuraciones predefinidas para los rubros clave (agro, minería, comercio), como la gestión de lotes para productos agrícolas o el manejo de diferentes unidades de medida.

---

## 4. Conclusiones y Próximos Pasos

El ERP "EVITA" tiene un gran potencial gracias a su sólida base tecnológica, pero requiere una inversión significativa en desarrollo para ser un producto viable y competitivo en el mercado argentino. Las fallas críticas detectadas, especialmente la falta de facturación electrónica y de un modo offline, son bloqueantes.

**Próximos Pasos Sugeridos:**

1.  **Priorización de Mejoras:** Enfocarse inmediatamente en las fallas **críticas** y de **severidad alta**. La integración con AFIP y la capacidad offline deben ser la máxima prioridad.
2.  **Plan de Desarrollo Detallado:** Crear un roadmap de desarrollo basado en las mejoras propuestas, con estimaciones de tiempo y recursos.
3.  **Fase de Pruebas con Usuarios Piloto:** Una vez implementadas las mejoras críticas, realizar una fase de pruebas con pymes y cooperativas del norte argentino para validar la usabilidad, la funcionalidad y la resiliencia del sistema en su entorno real.
4.  **Documentación y Capacitación:** Desarrollar manuales de usuario y material de capacitación que utilicen el lenguaje y los ejemplos del mercado local.