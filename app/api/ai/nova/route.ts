// app/api/ai/nova/route.ts
// Centralized, authenticated Personal AI Learning Partner API route
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkGeminiHealth, generateCompanionResponse } from '@/lib/ai/gemini-service';
import { buildStudentLearningContext, constructSystemPrompt, RuntimeStudentContext } from '@/lib/ai/student-context-builder';
import { updateAIMemoryFromConversation } from '@/lib/ai/memory-manager';

interface Message {
  role?: 'user' | 'model' | 'nova';
  sender?: 'user' | 'nova' | 'model';
  text: string;
}

export const dynamic = 'force-dynamic';

/**
 * GET: Server-side health check verifying environment variables, Gemini SDK, and connectivity.
 * Returns HTTP 200 with structured diagnostic state (online, rate_limited, unconfigured, offline).
 */
export async function GET() {
  const health = await checkGeminiHealth();
  return NextResponse.json(health, { status: 200 });
}

/**
 * POST: Authenticated, context-rich personalized study companion query.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      messages = [],
      studentContext = {},
      conversationId,
    }: {
      messages: Message[];
      studentContext: RuntimeStudentContext;
      conversationId?: string;
    } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one message is required.' },
        { status: 400 }
      );
    }

    const latestUserMsg = messages[messages.length - 1];
    const userPromptText = latestUserMsg?.text || '';

    // 1. Build deep, performance-aware student context
    const enrichedRuntime: RuntimeStudentContext = {
      ...studentContext,
      userPromptText,
    };

    const context = await buildStudentLearningContext(
      supabase,
      user?.id || null,
      enrichedRuntime
    );

    // 2. Construct pedagogical system prompt
    const systemPrompt = constructSystemPrompt(context);

    // 3. Format windowed conversation history for @google/genai (last 12 turns max)
    const recentMessages = messages.slice(-12);
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const msg of recentMessages) {
      const isUser = msg.role === 'user' || msg.sender === 'user';
      const geminiRole = isUser ? 'user' : 'model';
      const text = (msg.text || '').trim();
      if (!text) continue;

      if (contents.length > 0 && contents[contents.length - 1].role === geminiRole) {
        contents[contents.length - 1].parts[0].text += `\n\n${text}`;
      } else {
        contents.push({
          role: geminiRole,
          parts: [{ text }],
        });
      }
    }

    // Gemini requires alternating user/model roles starting with 'user'
    while (contents.length > 0 && contents[0].role !== 'user') {
      contents.shift();
    }

    if (contents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid user messages found in history.' },
        { status: 400 }
      );
    }

    // 4. Generate response via centralized Gemini service with automatic model cascade
    const result = await generateCompanionResponse({
      contents,
      systemInstruction: systemPrompt,
      temperature: 0.7,
      maxOutputTokens: 1200,
    });

    const latencyMs = Date.now() - startTime;
    console.log(`[AI Partner Invocation] Status: ${result.success}, Model: ${result.model}, Latency: ${latencyMs}ms`);

    if (!result.success || !result.text) {
      const isRateLimited = result.errorCode === 'RATE_LIMITED';
      const isUnconfigured = result.errorCode === 'NO_API_CONFIGURATION';
      const isAuthError = result.errorCode === 'INVALID_API_KEY' || result.errorCode === 'UNAUTHORIZED';
      const httpStatus = isRateLimited ? 429 : isUnconfigured ? 503 : isAuthError ? 401 : 502;

      return NextResponse.json(
        {
          success: false,
          error: result.error || 'AI partner is temporarily unavailable. Please try again.',
          code: result.errorCode || 'ERROR',
          partnerName: context.aiPartnerName,
        },
        { status: httpStatus }
      );
    }

    const replyText = result.text;

    // 5. Non-blocking asynchronous persistence & memory extraction
    if (user) {
      (async () => {
        try {
          // A. Persist to nova_conversations and nova_messages
          let activeConvoId = conversationId;
          if (!activeConvoId) {
            const { data: newConvo } = await supabase
              .from('nova_conversations')
              .insert({
                student_id: user.id,
                subject_name: context.currentSubject,
                title: `${context.currentTopic} Session`,
              })
              .select()
              .maybeSingle();

            activeConvoId = newConvo?.id;
          }

          if (activeConvoId) {
            await supabase.from('nova_messages').insert([
              {
                conversation_id: activeConvoId,
                sender: 'user',
                text: userPromptText,
                action_type: studentContext.actionType || null,
                language: context.preferredLanguage,
              },
              {
                conversation_id: activeConvoId,
                sender: 'nova',
                text: replyText,
                action_type: studentContext.actionType || null,
                language: context.preferredLanguage,
              },
            ]);
          }

          // B. Extract long-term learning habits & common mistakes
          await updateAIMemoryFromConversation(
            supabase,
            user.id,
            userPromptText,
            context.learningMemory,
            context.interactionPreferences
          );

          // C. Log learning event
          await supabase.from('learning_events').insert({
            student_id: user.id,
            event_type: 'ai_question_asked',
            metadata: {
              subject: context.currentSubject,
              topic: context.currentTopic,
              action_type: studentContext.actionType || 'chat',
              model: result.model,
              partner_name: context.aiPartnerName,
            },
          });
        } catch (dbErr) {
          console.warn('[AI Route] Non-blocking persistence note:', dbErr);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      reply: replyText,
      model: result.model,
      partnerName: context.aiPartnerName,
    });
  } catch (err: any) {
    console.error('[AI Route] General error:', err);
    const msg = err?.message || '';
    const isTimeout = msg.includes('timeout') || msg.includes('ETIMEDOUT');
    return NextResponse.json(
      {
        success: false,
        error: isTimeout
          ? 'Request to AI Learning Partner timed out. Please try asking again.'
          : 'Your AI Learning Partner encountered a connection delay. Please ask again in a moment.',
        code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      },
      { status: 500 }
    );
  }
}
