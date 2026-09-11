// lib/ai/gemini-service.ts
// Centralized server-side Gemini service using official @google/genai SDK
import { GoogleGenAI } from '@google/genai';

// Production model cascade:
// Primary: gemini-2.5-flash (Google official stable workhorse, hybrid reasoning, zero shutdown date)
// Fallback 1: gemini-2.5-flash-lite (cost-effective, high-throughput fallback)
// Fallback 2: gemini-3.5-flash (latest generation flash model)
export const DEFAULT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
] as const;

export type SupportedGeminiModel = typeof DEFAULT_MODELS[number];

/**
 * Returns prioritized list of Gemini models, allowing process.env.GEMINI_MODEL to override primary.
 */
export function getActiveModels(): string[] {
  const envModel = process.env.GEMINI_MODEL?.trim();
  const models = [
    ...(envModel ? [envModel] : []),
    ...DEFAULT_MODELS,
  ];
  return Array.from(new Set(models));
}

export interface GeminiResponseResult {
  success: boolean;
  text?: string;
  model?: string;
  error?: string;
  errorCode?: string;
}

export interface HealthCheckResult {
  status: 'online' | 'offline';
  configured: boolean;
  model: string;
  sdk: string;
  pingResponse?: string;
  error?: string;
  message: string;
}

/**
 * Retrieves the server-side Gemini API key strictly from process.env.
 * Never exposed to browser or client bundles.
 */
export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_KEY;
}

/**
 * Pings the Gemini API to verify credentials, connectivity, and model availability.
 */
export async function checkGeminiHealth(): Promise<HealthCheckResult> {
  const apiKey = getGeminiApiKey();
  const activeModels = getActiveModels();

  if (!apiKey) {
    return {
      status: 'offline',
      configured: false,
      model: activeModels[0],
      sdk: '@google/genai',
      message: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your deployment environment.',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    let workingModel = '';
    let responseText = '';
    let lastError: any = null;

    for (const model of activeModels) {
      try {
        const testResponse = await ai.models.generateContent({
          model,
          contents: 'Reply with exactly: NOVA_OK',
          config: {
            maxOutputTokens: 10,
            temperature: 0.1,
          },
        });

        if (testResponse?.text && testResponse.text.trim()) {
          workingModel = model;
          responseText = testResponse.text.trim();
          break;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (workingModel && responseText) {
      return {
        status: 'online',
        configured: true,
        model: workingModel,
        sdk: '@google/genai',
        pingResponse: responseText,
        message: `AI Learning Partner cortex is active, connected to ${workingModel}.`,
      };
    }

    throw lastError || new Error('No supported Gemini models returned a valid response');
  } catch (err: any) {
    console.error('[Gemini Service] Health check error:', err?.message || err);
    return {
      status: 'offline',
      configured: true,
      model: activeModels[0],
      sdk: '@google/genai',
      error: err?.message || 'Failed to communicate with Gemini API',
      message: 'Gemini API key is set, but the API request failed. Verify key permissions or quota.',
    };
  }
}

/**
 * Helper to pause execution for backoff retries.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates an educational companion response with multi-model cascade, retries, and structured error handling.
 */
export async function generateCompanionResponse(options: {
  contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  systemInstruction: string;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<GeminiResponseResult> {
  const apiKey = getGeminiApiKey();
  const activeModels = getActiveModels();

  if (!apiKey) {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured on the server.',
      errorCode: 'KEY_NOT_CONFIGURED',
      model: activeModels[0],
    };
  }

  const {
    contents,
    systemInstruction,
    temperature = 0.7,
    maxOutputTokens = 1200,
  } = options;

  const ai = new GoogleGenAI({ apiKey });
  let replyText = '';
  let usedModel = '';
  let lastError: any = null;

  for (const model of activeModels) {
    // Attempt up to 2 tries per model for transient rate limits or 503s
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature,
            maxOutputTokens,
          },
        });

        if (response?.text) {
          replyText = response.text;
          usedModel = model;
          break;
        } else {
          lastError = new Error(`Model ${model} returned empty response`);
        }
      } catch (sdkErr: any) {
        lastError = sdkErr;
        const msg = sdkErr?.message || '';
        const isTransient = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('503') || msg.includes('ETIMEDOUT');

        if (isTransient && attempt === 0) {
          // Wait briefly before 2nd try
          await delay(600);
          continue;
        }
        break; // Advance to next model in cascade
      }
    }

    if (replyText && usedModel) {
      break;
    }
  }

  if (replyText && usedModel) {
    return {
      success: true,
      text: replyText,
      model: usedModel,
    };
  }

  // Parse and categorize error safely without exposing keys or sensitive information
  const rawErrMsg = lastError?.message || 'Gemini service encountered an error';
  console.error('[Gemini Service] All models in cascade failed:', rawErrMsg);

  let studentFacingError = 'AI Learning Partner is temporarily unavailable. Please try again.';
  let errorCode = 'GEMINI_SERVER_ERROR';

  if (rawErrMsg.includes('API_KEY_INVALID') || (rawErrMsg.includes('400') && rawErrMsg.includes('API key not valid'))) {
    studentFacingError = 'Invalid Gemini API key configured on server. Please verify Render environment variables.';
    errorCode = 'INVALID_API_KEY';
  } else if (rawErrMsg.includes('403') || rawErrMsg.includes('PERMISSION_DENIED')) {
    studentFacingError = 'Unauthorized: The configured Gemini API key lacks permission for this request.';
    errorCode = 'UNAUTHORIZED';
  } else if (rawErrMsg.includes('NOT_FOUND') || rawErrMsg.includes('404') || rawErrMsg.includes('not supported') || rawErrMsg.includes('is not found')) {
    studentFacingError = 'Selected Gemini model is currently not available for this account.';
    errorCode = 'MODEL_NOT_FOUND';
  } else if (rawErrMsg.includes('RESOURCE_EXHAUSTED') || rawErrMsg.includes('429')) {
    studentFacingError = 'Gemini API rate limit or quota reached. Please wait a moment before asking again.';
    errorCode = 'QUOTA_EXCEEDED';
  } else if (rawErrMsg.includes('fetch failed') || rawErrMsg.includes('ECONNREFUSED') || rawErrMsg.includes('ENOTFOUND') || rawErrMsg.includes('ETIMEDOUT')) {
    studentFacingError = 'Network error communicating with Gemini services. Please try again.';
    errorCode = 'NETWORK_ERROR';
  } else if (rawErrMsg.includes('INVALID_ARGUMENT')) {
    studentFacingError = 'Invalid request parameters sent to Gemini.';
    errorCode = 'INVALID_REQUEST';
  }

  return {
    success: false,
    error: studentFacingError,
    errorCode,
    model: usedModel || activeModels[0],
  };
}
