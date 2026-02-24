# Aniquem Portal MVP 🛡️

Bienvenido al sistema centralizado de gestión para **Aniquem**. Este portal está diseñado para optimizar el seguimiento de alianzas, la gestión de la agenda institucional y el control de usuarios, todo sincronizado en tiempo real con la nube.

## 🚀 Características Principales

### 🤝 CRM de Alianzas
*   **Gestión de Socios**: Registro completo de empresas, contactos y RUC.
*   **Seguimiento Dinámico**: Control de estados (Nuevo, Contactado, Negociación, Cerrado).
*   **Sincronización Bidireccional**: Los datos se guardan y leen directamente de Google Sheets.

### 📅 Calendario Avanzado
*   **Vistas Flexibles**: Visualiza tu agenda por Mes, Semana o en modo Lista (Agenda).
*   **Google Meet Automation**: Generación de enlaces de videoconferencia con un solo clic.
*   **Notificaciones Inteligentes**: Envío automático de invitaciones por correo para eventos y reuniones virtuales.
*   **Detección de Conflictos**: Alerta inmediata si intentas agendar dos eventos a la misma hora.
*   **Carga Automática**: Sincronización instantánea al abrir el módulo.

### 👤 Gestión de Usuarios
*   **Control de Acceso (RBAC)**: Roles diferenciados para **Administradores** y **Usuarios**.
*   **Panel de Control**: Interfaz para crear, editar y eliminar miembros del equipo.
*   **Persistencia Segura**: Sesiones gestionadas con AuthContext y cifrado local.

### 📧 Centro de Mensajería
*   **Editor Visual**: Creador de correos con formato enriquecido (Rich Text).
*   **Plantillas**: Gestión de modelos de correo para respuestas rápidas.
*   **Estética Premium**: Interfaz moderna con efectos de cristal y modo oscuro nativo.

## 🛠️ Stack Tecnológico

*   **Frontend**: React + Vite
*   **Lenguaje**: TypeScript
*   **Estilos**: Tailwind CSS (Modern UI)
*   **Iconos**: Lucide React
*   **Notificaciones**: Sonner
*   **Backend**: Google Apps Script (Servidor Webhook)
*   **Base de Datos**: Google Sheets (Cloud Backend)

## ⚙️ Configuración y Despliegue

### Requisitos Previos
*   Node.js (v18+)
*   NPM o PNPM

### Instalación Local
1.  Clona el repositorio.
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```

### Configuración del Backend (Nube)
Este portal requiere un Webhook activo en Google Apps Script para funcionar correctamente.
1.  Crea un nuevo proyecto en [Google Apps Script](https://script.google.com/).
2.  Copia el código del backend (ubicado en `walkthrough.md` de la carpeta brain).
3.  Despliega como **Aplicación Web** con acceso a "Cualquiera" (Anyone).
4.  Pega la URL del despliegue en la constante `WEBHOOK_URL` de los archivos correspondientes (`Calendar.tsx`, `Alianzas.tsx`, `Users.tsx`).

## 📁 Estructura del Proyecto

```text
src/
├── components/   # Componentes reutilizables de UI
├── context/      # Estados globales (Autenticación)
├── hooks/        # Lógica compartida (LocalStorage, etc.)
├── pages/        # Módulos principales (Calendar, Alianzas, Users)
└── services/     # Integraciones externas (EmailService)
```

## 📄 Licencia
Este proyecto es de uso exclusivo para **Aniquem**.

---
*Desarrollado con ❤️ para Aniquem Portal.*