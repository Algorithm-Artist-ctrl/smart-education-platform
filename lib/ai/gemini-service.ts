// lib/ai/gemini-service.ts
// Centralized server-side Gemini service using official @google/genai SDK
import { GoogleGenAI } from '@google/genai';

// Production model cascade:
// Primary: gemini-3.8-flash (Google official intelligent flash model for long-horizon agentic workflows)
// Fallback 1: gemini-3.6-flash (balanced speed and multimodal everyday tasks)
// Fallback 2: gemini-2.5-flash (Google official stable workhorse, hybrid reasoning, zero shutdown date)
// Fallback 3: gemini-2.5-flash-lite (cost-effective, high-throughput fallback)
// Fallback 4: gemini-1.5-flash (legacy fallback)
export const DEFAULT_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
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
  status: 'online' | 'offline' | 'rate_limited' | 'unconfigured';
  configured: boolean;
  model: string;
  sdk: string;
  pingResponse?: string;
  error?: string;
  code?: string;
  message: string;
}

/**
 * Retrieves the server-side Gemini API key strictly from process.env.
 * Supports standard naming variations across Render, Vercel, and local setups.
 * Sanitizes whitespace and accidental surrounding quotes.
 */
export function getGeminiApiKey(): string | undefined {
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_AI_STUDIO_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!rawKey) return undefined;
  const cleaned = rawKey.trim().replace(/^["']|["']$/g, '');
  return cleaned || undefined;
}

// In-memory health check cache (5-minute TTL) to prevent quota exhaustion from frequent component mounts
let cachedHealth: { result: HealthCheckResult; expiresAt: number } | null = null;

/**
 * Validates Gemini API connectivity and credentials.
 * Utilizes a 5-minute cache to protect student sessions from hitting the 15 RPM free tier ceiling.
 */
export async function checkGeminiHealth(forceRefresh: boolean = false): Promise<HealthCheckResult> {
  const now = Date.now();
  if (!forceRefresh && cachedHealth && cachedHealth.expiresAt > now) {
    return cachedHealth.result;
  }

  const apiKey = getGeminiApiKey();
  const activeModels = getActiveModels();

  if (!apiKey) {
    const unconfiguredResult: HealthCheckResult = {
      status: 'unconfigured',
      configured: false,
      model: activeModels[0],
      sdk: '@google/genai',
      code: 'NO_API_CONFIGURATION',
      message: 'GEMINI_API_KEY is not configured in server environment variables. Please add GEMINI_API_KEY in your deployment settings.',
    };
    cachedHealth = { result: unconfiguredResult, expiresAt: now + 60_000 }; // Re-check in 1 min
    return unconfiguredResult;
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
        const msg = err?.message || '';
        // If 429 quota reached, do not test other models in cascade to prevent quota abuse
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
          break;
        }
      }
    }

    if (workingModel && responseText) {
      const onlineResult: HealthCheckResult = {
        status: 'online',
        configured: true,
        model: workingModel,
        sdk: '@google/genai',
        pingResponse: responseText,
        message: `NOVA AI Companion cortex is active, connected to ${workingModel}.`,
      };
      cachedHealth = { result: onlineResult, expiresAt: now + 300_000 }; // 5 min TTL
      return onlineResult;
    }

    const errMsg = lastError?.message || '';
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      const rateLimitedResult: HealthCheckResult = {
        status: 'rate_limited',
        configured: true,
        model: activeModels[0],
        sdk: '@google/genai',
        code: 'RATE_LIMITED',
        error: errMsg,
        message: 'Gemini API quota rate limit reached. Nova is momentarily waiting for quota replenishment.',
      };
      cachedHealth = { result: rateLimitedResult, expiresAt: now + 30_000 }; // 30s TTL
      return rateLimitedResult;
    }

    throw lastError || new Error('No supported Gemini models returned a valid response');
  } catch (err: any) {
    const rawMsg = err?.message || 'Failed to communicate with Gemini API';
    console.error('[Gemini Service] Health check notice:', rawMsg);

    const isKeyInvalid = rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('API key not valid');
    const isUnauthorized = rawMsg.includes('403') || rawMsg.includes('PERMISSION_DENIED');

    const offlineResult: HealthCheckResult = {
      status: 'offline',
      configured: true,
      model: activeModels[0],
      sdk: '@google/genai',
      code: isKeyInvalid ? 'INVALID_API_KEY' : isUnauthorized ? 'UNAUTHORIZED' : 'NETWORK_ERROR',
      error: rawMsg,
      message: isKeyInvalid
        ? 'The configured Gemini API key is invalid or expired. Please update GEMINI_API_KEY.'
        : isUnauthorized
          ? 'Gemini API key lacks permission for the requested models.'
          : 'Connecting to Gemini service encountered a network or server delay.',
    };

    cachedHealth = { result: offlineResult, expiresAt: now + 60_000 }; // 1 min TTL
    return offlineResult;
  }
}

/**
 * Invalidates the health cache upon a successful generation call.
 */
export function markGeminiHealthy(model: string): void {
  cachedHealth = {
    result: {
      status: 'online',
      configured: true,
      model,
      sdk: '@google/genai',
      message: `NOVA AI Companion cortex is active, connected to ${model}.`,
    },
    expiresAt: Date.now() + 300_000,
  };
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
      error: 'GEMINI_API_KEY is not configured in server environment variables.',
      errorCode: 'NO_API_CONFIGURATION',
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
    markGeminiHealthy(usedModel);
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
  let errorCode = 'ERROR';

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
    errorCode = 'RATE_LIMITED';
  } else if (rawErrMsg.includes('ETIMEDOUT') || rawErrMsg.includes('timeout') || rawErrMsg.includes('Deadline Exceeded')) {
    studentFacingError = 'Gemini API request timed out. Please try again.';
    errorCode = 'TIMEOUT';
  } else if (rawErrMsg.includes('fetch failed') || rawErrMsg.includes('ECONNREFUSED') || rawErrMsg.includes('ENOTFOUND')) {
    studentFacingError = 'Network error communicating with Gemini services. Please try again.';
    errorCode = 'NETWORK_ERROR';
  } else if (rawErrMsg.includes('returned empty response')) {
    studentFacingError = 'Gemini returned an empty response. Please ask again or rephrase.';
    errorCode = 'EMPTY_RESPONSE';
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
