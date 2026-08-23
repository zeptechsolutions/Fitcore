import { config } from '../config.js';
import AIUsage from '../models/AIUsage.js';

export function assertAIConfigured() {
  if (!config.geminiApiKey) {
    const error = new Error('AI is not configured. Add GEMINI_API_KEY to .env');
    error.statusCode = 503;
    throw error;
  }
}

function extractText(payload) {
  for (const candidate of payload?.candidates || []) {
    for (const part of candidate?.content?.parts || []) {
      if (typeof part?.text === 'string' && part.text.trim()) return part.text;
    }
  }
  return null;
}

function normalizeUsage(payload) {
  const usage = payload?.usageMetadata || {};
  return {
    inputTokens: Number(usage.promptTokenCount || 0),
    outputTokens: Number(usage.candidatesTokenCount || 0),
    totalTokens: Number(usage.totalTokenCount || 0)
  };
}

async function logUsage({ userId, feature, model, response, success, errorCode, latencyMs }) {
  const usage = normalizeUsage(response);
  try {
    await AIUsage.create({
      user: userId,
      feature,
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      success,
      errorCode,
      latencyMs
    });
  } catch (error) {
    console.error('Could not save AI usage:', error.message);
  }
}

export async function callStructuredAI({ userId, feature, instructions, input, schemaName, schema, model = config.aiModel }) {
  assertAIConfigured();
  const startedAt = Date.now();
  let responsePayload;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.geminiApiKey
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: instructions }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: String(input) }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: schema,
          temperature: 0.2
        }
      })
    });

    responsePayload = await response.json();

    if (!response.ok) {
      const providerMessage = responsePayload?.error?.message || 'Gemini request failed';
      const providerStatus = responsePayload?.error?.status || 'GEMINI_ERROR';

      // Never expose Gemini's 401/403 as an authentication failure for Zhealth.
      // Otherwise the frontend could mistake a provider/configuration error for
      // an expired user JWT and log the user out.
      let statusCode = response.status;
      let message = providerMessage;

      if (response.status === 401 || response.status === 403) {
        statusCode = 502;
        message = `Gemini authentication/configuration error: ${providerMessage}`;
      } else if (response.status === 404) {
        statusCode = 502;
        message = `Gemini model or endpoint unavailable: ${providerMessage}`;
      }

      const error = new Error(message);
      error.statusCode = statusCode;
      error.code = providerStatus;
      error.providerStatus = response.status;
      throw error;
    }

    const text = extractText(responsePayload);
    if (!text) {
      const blockReason = responsePayload?.promptFeedback?.blockReason;
      const error = new Error(blockReason ? `Gemini blocked the request: ${blockReason}` : 'AI returned no structured output');
      error.statusCode = 502;
      error.code = blockReason || 'EMPTY_AI_OUTPUT';
      throw error;
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const error = new Error('Gemini returned invalid JSON');
      error.statusCode = 502;
      error.code = 'INVALID_AI_JSON';
      throw error;
    }

    await logUsage({
      userId,
      feature,
      model,
      response: responsePayload,
      success: true,
      latencyMs: Date.now() - startedAt
    });

    return parsed;
  } catch (error) {
    await logUsage({
      userId,
      feature,
      model,
      response: responsePayload,
      success: false,
      errorCode: error.code || 'AI_REQUEST_FAILED',
      latencyMs: Date.now() - startedAt
    });
    throw error;
  }
}
