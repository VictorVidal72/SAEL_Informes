# Sistema Automático de Gestión de Informes DPD

Plataforma integral para la automatización de flujos de trabajo, validación de expedientes y generación de documentos PDF de alta fidelidad para el Servicio de Asistencia a las Entidades Locales (SAEL) en materia de Protección de Datos.

---

## 📚 Parte 1: Manual de Usuario

Este manual detalla el procedimiento operativo estandarizado para la generación de informes técnicos y oficios de remisión.

### 1. Inicio del Trámite
1. Acceda a la pantalla principal del generador.
2. Utilice el **Selector de Ayuntamiento** para elegir la entidad local solicitante. Al seleccionarla, el sistema conectará de forma segura con la base de datos para recuperar la información de la entidad y de su representante legal (Alcalde/sa o Presidente/a).
3. Seleccione el **Tipo de Trámite**:
   * *Petición general:* Consultas ordinarias de los ayuntamientos.
   * *Requerimiento CTPDA:* Asuntos derivados del Consejo de Transparencia y Protección de Datos de Andalucía.
4. Active o desactive el interruptor **"¿Requiere Oficio de Remisión?"** dependiendo de si el documento se va a remitir a una administración externa o es de uso interno.

### 2. Panel de Estado y Validación (El Semáforo)
El sistema evalúa en tiempo real los datos recuperados y le muestra un panel visual:
* **🟢 En verde (Datos de BD):** Información recuperada automáticamente (ej. CIF, Código DIR3, Nombre del Representante). Estos campos están bloqueados para garantizar la integridad del dato, pero pueden ser editados excepcionalmente pulsando el botón "Editar".
* **🔴 En rojo (Faltan Datos):** Campos obligatorios para el trámite seleccionado que deben ser introducidos manualmente (ej. Asunto, Número de Informe, Iniciales de firma).

### 3. Lógica Condicional Inteligente
El formulario se adapta a sus decisiones:
* Si el trámite es un **Requerimiento CTPDA**, el sistema le exigirá obligatoriamente que introduzca el número de expediente RCON.
* Si activa el **Oficio de Remisión**, el sistema verificará que el Ayuntamiento tenga un Código DIR3 asignado. Si no lo tiene, se le exigirá para poder preparar el envío a la Red SARA.

### 4. Generación de Documentos
Los botones de generación de PDF permanecerán deshabilitados por seguridad hasta que el 100% de las variables obligatorias estén completas. Una vez validadas:
* Pulse **"Generar Informe DPD"** para obtener el dictamen técnico principal.
* Pulse **"Generar Oficio de Remisión"** (si aplica) para obtener la carta de acompañamiento.

---

## ⚙️ Parte 2: Documentación Técnica y Arquitectura

Este proyecto está construido con un enfoque estricto en la mantenibilidad, la escalabilidad y la separación de responsabilidades.

### Stack Tecnológico
* **Framework Core:** Astro (optimizado para rendimiento y enrutamiento).
* **Lógica de Interfaz:** React (componentes funcionales y gestión de estado complejo).
* **Estilos:** Tailwind CSS (maquetación utility-first, asegurando coherencia visual).
* **Validación:** Zod (schemas estrictos para garantizar la integridad de los payloads).
* **Renderizado PDF:** `@react-pdf/renderer` (generación de documentos mediante componentes React de alta fidelidad).
* **Base de Datos:** PostgreSQL a través de Supabase.

### Estructura del Proyecto
El código fuente sigue una arquitectura modular en el directorio `/src`:
* `/components`: Componentes aislados de React y Astro.
  * `GeneratorForm.tsx`: Núcleo interactivo de la aplicación. Gestiona el estado local, el panel semáforo y condicionales.
  * `ReportPDF.tsx` / `RemisionPDF.tsx`: Componentes desacoplados exclusivos para la maquetación en folio A4.
* `/lib`: Servicios e integraciones externas.
  * `supabase.ts`: Inicialización del cliente y conexión a DB.
  * `report-validation.ts`: Reglas de negocio y esquemas de Zod.
  * `report-data.service.ts`: Capa de abstracción para consultas SQL tipadas.
* `/pages`: Rutas de la aplicación web gestionadas por Astro (`index.astro`).

### 🛡️ Seguridad y Modelo de Datos (Supabase)
El sistema implementa **Row Level Security (RLS)** a nivel de base de datos de forma estricta.

1. **Políticas de Acceso:** La base de datos está protegida contra inyecciones y accesos externos no autorizados. Las conexiones mediante clave pública (`anon`) operan bajo políticas de **Solo Lectura (`SELECT`)**.
2. **Tablas Relacionales Core:**
   * `Ayuntamiento`: Datos fiscales y operativos (CIF, Código DIR3).
   * `Contacto`: Información de representantes y cargos.
   * `Expediente`: Gestión unificada de referencias (SAEL, RCON, Interno).
   * `Informe`: Histórico de documentos generados.

### 🚀 Instalación y Entorno de Desarrollo

**Requisitos previos:** Node.js (v18+) y NPM.

1. Clonar el repositorio y acceder al directorio:
   ```bash
   cd gestion-informes