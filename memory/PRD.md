# BiciValera — PRD

## Problem Statement
BiciValera es un sistema inteligente de bicicletas compartidas para Valera, Estado Trujillo. App móvil (Expo/React Native) que presenta la visión de movilidad sostenible, el impacto ambiental (reducción de CO₂) y un simulador en tiempo real para monitorear estaciones, usuarios y el estado de la flota (bicicletas mecánicas y eléctricas).

## Architecture
- **Backend:** FastAPI + MongoDB (motor). JWT auth (pyjwt + bcrypt). Endpoints prefijados con `/api`. Seed automático de 8 estaciones de Valera con flota mecánica/eléctrica al iniciar.
- **Frontend:** Expo Router (file-based), tabs (Mapa/Impacto/Viajes/Perfil), auth guard con AuthContext, storage seguro para token JWT. Tema verde/eco.

## User Personas
- Ciudadano de Valera que quiere moverse de forma sostenible y ver su impacto.
- Observador del sistema (autoridades/comunidad) que monitorea la flota en tiempo real.

## Core Requirements (static)
1. Registro/login email+password (JWT).
2. Mapa de estaciones con inventario (mecánicas vs eléctricas).
3. Simulador en tiempo real de flota (conteos + bicis en movimiento).
4. Flujo de alquiler simulado (desbloquear → viaje activo → finalizar).
5. Dashboard de impacto (CO₂ evitado, km, tiempo, calorías, árboles; stats de ciudad).

## Implemented (2026-07-15) — MVP
- Auth JWT completo (register/login/me) + guard de navegación.
- Estaciones + detalle con selección de bici y `POST /rides/start`.
- Ciclo de viaje: start → active (1 activo por usuario) → end (distancia/CO₂ calculados) → historial.
- Impacto (usuario + ciudad) y Simulador en vivo (poll cada 4s en mapa).
- Mapa custom canvas con marcadores proyectados por lat/lon + bicis simuladas en movimiento.
- Unlock modal con escáner simulado + entrada manual de código.
- Perfil con estado de flota en vivo y cerrar sesión.
- Testing: backend 12/12 pytest, frontend flujo completo verificado.

## Backlog
- **P1:** Reserva de bici por tiempo; filtros de tipo de bici en el mapa; tarifa/costo del viaje.
- **P1:** Gráficos de tendencia de impacto (semanal/mensual) con victory-native.
- **P2:** react-native-maps real cuando se despliegue a dispositivo; cámara real en Unlock (expo-camera).
- **P2:** Rutas sugeridas entre estaciones; ranking comunitario de impacto.
- **Tech debt:** migrar `shadow*` → `boxShadow` y `pointerEvents` a style (warnings RN web).

## Next Tasks
- Confirmar prioridades con el usuario; implementar filtros de tipo de bici en el mapa y gráficos de tendencia de impacto.
