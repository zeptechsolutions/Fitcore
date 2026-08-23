# FitCore Backend

Backend inicial para FitCore con Node.js, Express, MongoDB Atlas y Mongoose.

## Incluye

- Registro e inicio de sesión con JWT
- Perfil y objetivos del usuario
- Comidas y macros
- Hidratación por fracciones de botella
- Historial de peso e IMC
- Meta semanal de gym
- Recetas
- Dashboard diario y score inicial
- Modelo base de amistades

## Estructura

src/
- controllers/
- models/
- routes/
- utils/
- config.js
- App.js
- database.js
- index.js

## Configuración

1. Copia `.env.example` a `.env`.
2. Agrega tu URI nueva de MongoDB Atlas. No uses la contraseña que expusiste anteriormente; cámbiala en Atlas primero.
3. Define un JWT_SECRET largo y privado.
4. Instala las dependencias.
5. Inicia el servidor.

## Endpoints principales

- POST /api/auth/register
- POST /api/auth/login
- GET/PATCH /api/users/me
- GET /api/users/me/bmi
- GET/POST /api/meals
- PATCH/DELETE /api/meals/:id
- GET/POST /api/water
- DELETE /api/water/:id
- GET/POST /api/weights
- DELETE /api/weights/:id
- GET/POST /api/gym
- DELETE /api/gym/:id
- GET/POST /api/recipes
- PATCH/DELETE /api/recipes/:id
- GET /api/dashboard/daily

## Pendiente para siguientes versiones

- IA para interpretar comidas
- Código de barras
- Estadísticas históricas avanzadas
- Rachas, XP e insignias
- Amigos, rankings y retos
- Resumen semanal por IA
