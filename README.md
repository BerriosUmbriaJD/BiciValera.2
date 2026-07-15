# BiciValera 🚲

Una aplicación integral diseñada para facilitar la movilidad urbana a través del alquiler y gestión de bicicletas compartidas. BiciValera permite a los usuarios encontrar estaciones, desbloquear bicicletas, monitorear su actividad física y medir su impacto ambiental positivo.

## 🚀 Características Principales

* **Autenticación Segura:** Sistema completo de registro e inicio de sesión para usuarios (`login` / `register`).
* **Navegación Intuitiva:** Interfaz basada en pestañas (Tabs) para un acceso rápido a las funciones principales.
* **Gestión de Estaciones:** Visualización detallada del estado y disponibilidad de bicicletas en cada estación específica (`station/[id]`).
* **Sistema de Desbloqueo:** Módulo dedicado para liberar las bicicletas en las estaciones y comenzar el viaje (`unlock`).
* **Registro de Actividad:** Historial detallado de los viajes realizados y métricas de uso (`activity`).
* **Panel de Impacto:** Seguimiento de la huella de carbono reducida y el impacto ambiental positivo del usuario (`impact`).
* **Perfil de Usuario:** Administración de cuenta y preferencias personales (`profile`).

## 🛠️ Tecnologías Utilizadas

* **Frontend:** React Native + Expo utilizando Expo Router (enrutamiento basado en archivos) y TypeScript.
* **Backend:** Python (servidor web centralizado).
* **Despliegue/Infraestructura:** Automatización y tareas programadas manejadas vía Emergent (`.emergent/cron`).

## 📁 Estructura del Proyecto

La aplicación está dividida en dos módulos principales: Frontend y Backend.

```text
BiciValera.2/
├── backend/                  # Lógica del servidor y base de datos
│   ├── server.py             # Archivo principal del servidor Python
│   ├── requirements.txt      # Dependencias de Python
│   └── tests/                # Pruebas unitarias (test_bicivalera.py)
│
├── frontend/                 # Aplicación móvil (React Native / Expo)
│   ├── app/                  # Rutas de Expo Router
│   │   ├── (auth)/           # Rutas de autenticación (login, register)
│   │   ├── (tabs)/           # Vistas principales (index, activity, impact, profile)
│   │   ├── station/          # Vistas dinámicas de estaciones ([id].tsx)
│   │   └── unlock.tsx        # Pantalla de desbloqueo de bicicletas
│   ├── assets/               # Fuentes (SpaceMono) e imágenes
│   └── app.json              # Configuración global de Expo
│
├── .emergent/                # Configuración de despliegue y webhooks (cron)
└── design_guidelines.json    # Guías de diseño de UI/UX del proyecto

```

## ⚙️ Instalación y Configuración Local

Sigue estos pasos para ejecutar el entorno de desarrollo en tu máquina local.

### 1. Configuración del Backend (Python)

Navega al directorio del backend, crea un entorno virtual e instala las dependencias:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows usa: venv\Scripts\activate
pip install -r requirements.txt
python server.py

```

### 2. Configuración del Frontend (Expo)

Abre una nueva terminal, navega al directorio del frontend e instala los paquetes de Node:

```bash
cd frontend
npm install
npx expo start

```

*Nota: Escanea el código QR generado en la terminal con la aplicación Expo Go en tu dispositivo físico, o presiona `a` para abrir en un emulador de Android / `i` para un simulador de iOS.*

## 📦 Lanzamiento (Release)

### Versión Actual: `v1.0.0`

Para generar una compilación de producción (APK para Android o IPA para iOS), el proyecto está configurado para utilizar **EAS Build** (Expo Application Services).

Si deseas construir la aplicación por tu cuenta, ejecuta los siguientes comandos desde la carpeta `frontend/`:

1. Instala el CLI de EAS (si no lo tienes):
```bash
npm install -g eas-cli

```


2. Inicia sesión en tu cuenta de Expo:
```bash
eas login

```


3. Genera la build para Android (APK):
```bash
eas build -p android --profile preview

```


*Nota: Revisa el archivo `eas.json` (si está disponible) para ver los perfiles de construcción configurados.*

Los binarios compilados y las notas de la versión más reciente también estarán disponibles en la pestaña de **Releases** del repositorio cuando sean publicados oficialmente.

## 👨‍💻 Autores

* **Jesus David Berrios**
* **Andrea Moreno**
