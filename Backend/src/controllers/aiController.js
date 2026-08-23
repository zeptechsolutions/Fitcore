import AIUsage from '../models/AIUsage.js';
import { callStructuredAI } from '../utils/ai.js';
import { buildPatternDataset, buildPeriodSummary, buildQuestionContext, currentWeekRange, previousRange } from '../utils/aiStats.js';

const mealSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    confidence: { type: 'number' },
    disclaimer: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          calories: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fats: { type: 'number' },
          estimated: { type: 'boolean' }
        },
        required: ['name', 'quantity', 'unit', 'calories', 'protein', 'carbs', 'fats', 'estimated']
      }
    },
    totals: {
      type: 'object',
      additionalProperties: false,
      properties: {
        calories: { type: 'number' },
        protein: { type: 'number' },
        carbs: { type: 'number' },
        fats: { type: 'number' }
      },
      required: ['calories', 'protein', 'carbs', 'fats']
    }
  },
  required: ['title', 'confidence', 'disclaimer', 'items', 'totals']
};

const textAnalysisSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    headline: { type: 'string' },
    summary: { type: 'string' },
    positives: { type: 'array', items: { type: 'string' } },
    opportunities: { type: 'array', items: { type: 'string' } },
    patterns: { type: 'array', items: { type: 'string' } }
  },
  required: ['headline', 'summary', 'positives', 'opportunities', 'patterns']
};

const intentSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    domains: {
      type: 'array',
      items: { type: 'string', enum: ['summary', 'score', 'weight', 'water', 'gym', 'meals', 'macros', 'activity', 'sleep'] }
    },
    from: { type: ['string', 'null'] },
    to: { type: ['string', 'null'] }
  },
  required: ['domains', 'from', 'to']
};

const answerSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    answer: { type: 'string' },
    keyValues: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { label: { type: 'string' }, value: { type: 'string' } },
        required: ['label', 'value']
      }
    },
    limitation: { type: ['string', 'null'] }
  },
  required: ['answer', 'keyValues', 'limitation']
};

export async function analyzeMeal(req, res) {
  const description = String(req.body.description || '').trim();
  if (description.length < 3) return res.status(400).json({ message: 'Meal description is required' });
  if (description.length > 2000) return res.status(400).json({ message: 'Meal description is too long' });

  const result = await callStructuredAI({
    userId: req.user.id,
    feature: 'meal_analysis',
    schemaName: 'fitcore_meal_analysis',
    schema: mealSchema,
    instructions: [
      'You are Zhealth meal parser. Convert a natural-language meal description into an approximate nutrition estimate.',
      'Return calories in kcal and protein/carbs/fats in grams.',
      'Use realistic common serving estimates when quantity is vague. Never claim medical precision.',
      'confidence must be between 0 and 1. The disclaimer must clearly say values are estimates and should be reviewed.',
      'Totals must equal the sum of the listed items as closely as possible.'
    ].join(' '),
    input: description
  });

  res.json({ ...result, source: 'ai', originalDescription: description, saveRequired: true });
}

export async function weeklySummary(req, res) {
  const range = currentWeekRange(req.query.date || new Date());
  const previous = previousRange(range);
  const [currentData, previousData] = await Promise.all([
    buildPeriodSummary(req.user.id, range),
    buildPeriodSummary(req.user.id, previous)
  ]);

  const result = await callStructuredAI({
    userId: req.user.id,
    feature: 'weekly_summary',
    schemaName: 'fitcore_weekly_summary',
    schema: textAnalysisSchema,
    instructions: [
      'You are Zhealth weekly analyst. Explain only what is supported by the supplied fitness tracking data.',
      'Be concise, encouraging but neutral. Do not diagnose conditions or prescribe medical treatment.',
      'Compare current week with previous week when data exists. If trackedDays is low, explicitly note limited data.',
      'Opportunities must be practical observations based on goal adherence, not medical advice.'
    ].join(' '),
    input: JSON.stringify({ currentWeek: currentData, previousWeek: previousData })
  });

  res.json({ period: range, data: currentData, ai: result });
}

export async function detectPatterns(req, res) {
  const dataset = await buildPatternDataset(req.user.id, req.query.days || 30);
  const result = await callStructuredAI({
    userId: req.user.id,
    feature: 'patterns',
    schemaName: 'fitcore_patterns',
    schema: textAnalysisSchema,
    instructions: [
      'You are Zhealth pattern analyst. Identify only patterns that can be directly supported by the provided aggregates.',
      'Do not infer causation from correlation. Do not provide medical diagnoses.',
      'If there is insufficient data, say so. Prefer numeric comparisons when useful.'
    ].join(' '),
    input: JSON.stringify(dataset)
  });

  res.json({ data: dataset, ai: result });
}

export async function askZhealth(req, res) {
  const question = String(req.body.question || '').trim();
  if (question.length < 3) return res.status(400).json({ message: 'Question is required' });
  if (question.length > 1000) return res.status(400).json({ message: 'Question is too long' });

  const today = new Date().toISOString().slice(0, 10);
  const intent = await callStructuredAI({
    userId: req.user.id,
    feature: 'ask',
    schemaName: 'fitcore_question_intent',
    schema: intentSchema,
    instructions: [
      `Today is ${today}.`,
      'Classify which Zhealth data domains are needed to answer the question.',
      'Resolve relative dates such as this month, last week or three months ago into ISO YYYY-MM-DD boundaries.',
      'Use summary for broad questions. Return at least one domain.'
    ].join(' '),
    input: question
  });

  if (!intent.domains.length) intent.domains = ['summary'];
  const context = await buildQuestionContext(req.user.id, intent);

  const answer = await callStructuredAI({
    userId: req.user.id,
    feature: 'ask',
    schemaName: 'fitcore_question_answer',
    schema: answerSchema,
    instructions: [
      'Answer the user question using ONLY the supplied Zhealth data.',
      'Never invent missing values. If the data cannot answer the question, state the limitation.',
      'Do not diagnose illness or provide medical treatment. Keep the answer concise and in the same language as the question.'
    ].join(' '),
    input: JSON.stringify({ question, context })
  });

  res.json({ question, interpretedAs: intent, answer });
}

export async function getAIUsage(req, res) {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await AIUsage.find({ user: req.user.id, createdAt: { $gte: since } }).sort({ createdAt: -1 }).lean();
  const totals = rows.reduce((acc, row) => {
    acc.requests += 1;
    acc.successful += row.success ? 1 : 0;
    acc.inputTokens += row.inputTokens || 0;
    acc.outputTokens += row.outputTokens || 0;
    acc.totalTokens += row.totalTokens || 0;
    return acc;
  }, { requests: 0, successful: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 });

  res.json({ days, totals, recent: rows.slice(0, 50) });
}
