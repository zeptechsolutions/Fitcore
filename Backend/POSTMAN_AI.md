# FitCore V3 — AI tests in Postman

All AI routes require the same Bearer JWT used by the rest of FitCore.

Base URL: `http://localhost:4000`

## 1. Analyze a meal

POST `/api/ai/meals/analyze`

Body (raw JSON):

```json
{
  "description": "Comí 3 huevos, 2 panes con aguacate y un vaso de leche"
}
```

This returns an estimate only. Review it and then save the approved items using the normal meal endpoint.

## 2. Weekly AI summary

GET `/api/ai/weekly-summary`

Optional selected week:

GET `/api/ai/weekly-summary?date=2026-08-22`

## 3. Pattern detection

GET `/api/ai/patterns?days=30`

Accepted range: 14–180 days.

## 4. Ask FitCore AI

POST `/api/ai/ask`

```json
{
  "question": "¿Cuánto peso he ganado este mes?"
}
```

Other examples:

- `¿Cuál fue mi promedio de proteína este mes?`
- `¿Cuántas veces entrené esta semana?`
- `¿Cómo estuvo mi hidratación este mes?`
- `¿Qué comida ha sido la más calórica este mes?`

## 5. AI usage

GET `/api/ai/usage?days=30`

Returns number of requests, successful requests and token counts.

## Setup

Your `.env` needs:

```text
OPENAI_API_KEY=YOUR_KEY
AI_MODEL=gpt-5.6-luna
```

Do not put `OPENAI_API_KEY` in React and do not commit `.env` to Git.
