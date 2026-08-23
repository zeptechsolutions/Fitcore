# FitCore Frontend v1.0

Frontend mobile-first para FitCore, construido con React + Vite.

## Inicio
1. Copia `.env.example` como `.env`.
2. Confirma que `VITE_API_URL=http://localhost:4000/api` coincida con tu backend.
3. Ejecuta `npm i`.
4. Ejecuta `npm run dev`.
5. Abre la URL que muestre Vite (normalmente http://localhost:5173).

## Backend
Está diseñado para `fitcore-backend-v1.0` y utiliza autenticación Bearer JWT.

## Áreas incluidas
- Login / registro
- Dashboard diario
- Nutrición y macros
- Registro de comida por IA
- Registro manual y barcode
- Favoritos y recetas
- Agua por botellas
- Peso / IMC / medidas
- Gym semanal
- Estadísticas y calendario
- Rachas, XP e insignias
- Amigos, solicitudes, ranking y retos
- FitCore AI
- Perfil, objetivos, privacidad y recordatorios

## Diseño
Mobile-first. Morado como identidad, verde para progreso y amarillo para gamificación, con bordes redondeados moderados.

## Probar desde un teléfono físico
Si abrís Vite desde un teléfono conectado a la misma red Wi‑Fi, `localhost` no apunta a tu PC. Usa la IP local de tu computadora:
- Frontend `.env`: `VITE_API_URL=http://IP_DE_TU_PC:4000/api`
- Backend `.env`: `CLIENT_URL=http://IP_DE_TU_PC:5173`

El servidor Vite ya está configurado con `host: true` para aceptar conexiones de la red local.
