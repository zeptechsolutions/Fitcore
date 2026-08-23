# FitCore v1.0 - Smoke test en Postman

Usa `http://localhost:4000` y, después del login, agrega `Authorization: Bearer TU_TOKEN`.

## Salud
GET /api/health

## Auth
POST /api/auth/register
POST /api/auth/login

## Usuario
GET /api/users/me
PATCH /api/users/me
GET /api/users/me/bmi

## Comidas
GET /api/meals?date=2026-08-22
POST /api/meals
PATCH /api/meals/:id
DELETE /api/meals/:id

## Favoritos
GET /api/favorites
POST /api/favorites
POST /api/favorites/:id/log
PATCH /api/favorites/:id
DELETE /api/favorites/:id

## Nutrición / barcode
GET /api/nutrition/barcode/:barcode
POST /api/nutrition/barcode/:barcode/calculate
Body: { "grams": 60 }

## Agua
GET /api/water?date=2026-08-22
POST /api/water
DELETE /api/water/:id

## Peso / medidas / gym / recetas
GET/POST según sus rutas existentes: /api/weights, /api/measurements, /api/gym, /api/recipes

## Dashboard / estadísticas
GET /api/dashboard?date=2026-08-22
GET /api/stats/weekly
GET /api/stats/monthly
GET /api/stats/calendar
GET /api/stats/streaks

## Social
GET /api/social/search?q=nombre
POST /api/social/requests
GET /api/social/requests
PATCH /api/social/requests/:id
GET /api/social/friends
GET /api/social/friends/:userId
GET /api/social/ranking
DELETE /api/social/friends/:userId

## Retos / gamificación
GET /api/challenges
POST /api/challenges
PATCH /api/challenges/:id/progress
GET /api/gamification

## Recordatorios
GET /api/reminders/preferences
PATCH /api/reminders/preferences
GET /api/reminders/due

## IA
POST /api/ai/meals/analyze
POST /api/ai/ask
GET /api/ai/weekly-summary
GET /api/ai/patterns?days=30
GET /api/ai/usage
