# Changelog

Todos los cambios notables del proyecto **BiciValera.2** se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-07-25

### Añadido (Added)
- **Mapa Interactivo de Estaciones:** Nueva vista frontend interactiva que muestra las estaciones disponibles en tiempo real en la ciudad de Valera.
- **Sistema de Autenticación Seguro:** Registro e inicio de sesión con validación de identidad (Cédula).
- **Módulo de Préstamo con QR/PIN:** Generación de códigos dinámicos para el desbloqueo de las bicicletas en el anclaje físico.
- **Panel de Administrador (Dashboard):** Interfaz para la gestión integral de la flota de bicicletas, monitoreo de estaciones y bloqueo/suspensión de usuarios.
- **Simulación de Hardware:** Módulo mock para representar la interacción de la estación física y la base de datos (luces led simuladas de estado verde/rojo).

### Cambiado (Changed)
- **Arquitectura del Sistema:** Refactorización completa pasando a una arquitectura API REST para mejorar la escalabilidad y separar el frontend del backend.
- **Modelo de Base de Datos:** Actualización del esquema relacional (MySQL/PostgreSQL) para soportar historiales de viaje y estados en tiempo real (Disponible, En Tránsito, Mantenimiento).

### Corregido (Fixed)
- Problemas de concurrencia al momento en que dos usuarios intentaban solicitar la misma bicicleta simultáneamente.
- Corrección de bugs menores en el cálculo de la duración de los viajes.

## [1.0.0] - Versión Inicial (BiciValera v1)

### Añadido (Added)
- Prototipo inicial del concepto de préstamo de bicicletas.
- Interfaz básica de usuario y lista estática de estaciones.
- Base de datos preliminar de usuarios.
