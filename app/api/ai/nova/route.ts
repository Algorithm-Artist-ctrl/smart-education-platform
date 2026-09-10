// app/api/ai/nova/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface Message {
  role: 'user' | 'model' | 'nova';
  text: string;
}

interface StudentContext {
  studentName?: string;
  level?: number;
  currentSubject?: string;
  weakTopics?: string[];
  language?: 'en' | 'hi';
  actionType?: 'explain_10' | 'simplify' | 'example' | 'hint' | 'practice' | 'quiz' | string;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate student session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your environment variables to enable live AI responses.',
          code: 'KEY_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { 
      messages = [], 
      studentContext = {}, 
      conversationId 
    }: { 
      messages: Message[]; 
      studentContext: StudentContext; 
      conversationId?: string 
    } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one message is required.' },
        { status: 400 }
      );
    }

    // Compose personalized system prompt
    const studentName = studentContext.studentName || 'Student';
    const level = studentContext.level || 1;
    const subject = studentContext.currentSubject || 'General Academics';
    const language = studentContext.language || 'en';
    const actionType = studentContext.actionType;

    const weakTopicsStr = studentContext.weakTopics && studentContext.weakTopics.length > 0
      ? `The student has currently identified focus areas in: ${studentContext.weakTopics.join(', ')}.`
      : '';

    let languageInstruction = 'Respond in English with clear, engaging, encouraging, and supportive language.';
    if (language === 'hi') {
      languageInstruction = 'Respond primarily in natural, clear Hindi (हिंदी), using English academic terms in parentheses where appropriate (e.g. "समीकरण (equation)"). Maintain a friendly, motivating mentor persona.';
    }

    let actionInstruction = '';
    if (actionType === 'explain_10') {
      actionInstruction = 'CRITICAL: Explain this concept as if the student is 10 years old. Use a vivid everyday analogy and short, intuitive sentences.';
    } else if (actionType === 'simplify') {
      actionInstruction = 'CRITICAL: Make your explanation as simple and straightforward as possible in 3 clear bullet points with zero unnecessary jargon.';
    } else if (actionType === 'example') {
      actionInstruction = 'CRITICAL: Provide a memorable, real-world everyday example illustrating this concept in action.';
    } else if (actionType === 'hint') {
      actionInstruction = 'CRITICAL: Give a subtle, guiding hint to help the student figure out the solution themselves. DO NOT give away the final answer.';
    } else if (actionType === 'practice') {
      actionInstruction = 'CRITICAL: Provide ONE targeted practice problem matching Level ' + level + ' with 4 multiple choice options (A, B, C, D). Ask the student to pick the right option.';
    } else if (actionType === 'quiz') {
      actionInstruction = 'CRITICAL: Formulate a mini-quiz with 2 progressive questions to test conceptual understanding.';
    }

    const systemPrompt = `You are Nova, the intelligent, friendly, and adaptive 3D study mentor on the Smart Edu platform.
You are tutoring ${studentName}, who is currently at Level ${level}, focusing on ${subject}.
${weakTopicsStr}

Language Directive:
${languageInstruction}

Special Action Directive:
${actionInstruction}

Core Tutoring Principles:
1. Explain academic concepts step-by-step with intuitive clarity, using real-world analogies and visual descriptions.
2. If the student answers a question, evaluate it constructively, highlighting what they did right before guiding errors.
3. Keep explanations concise, structured, and visually pleasant using Markdown formatting (bolding, lists, and formula notation like ax² + bx + c = 0).
4. Never repeat generic greetings once a conversation is underway.
5. Always stay in character as a motivating, warm, and supportive AI study mentor.`;

    // Format conversation history for Gemini API (max 10 recent turns)
    const recentMessages = messages.slice(-10);
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const msg of recentMessages) {
      const geminiRole = msg.role === 'user' ? 'user' : 'model';
      if (!msg.text || !msg.text.trim()) continue;

      if (contents.length > 0 && contents[contents.length - 1].role === geminiRole) {
        contents[contents.length - 1].parts[0].text += `\n\n${msg.text.trim()}`;
      } else {
        contents.push({
          role: geminiRole,
          parts: [{ text: msg.text.trim() }],
        });
      }
    }

    if (contents.length > 0 && contents[0].role !== 'user') {
      contents.shift();
    }

    if (contents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid user messages found in history.' },
        { status: 400 }
      );
    }

    // Call Gemini API (trying gemini-2.5-flash, gemini-1.5-flash, gemini-2.0-flash)
    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let lastError: any = null;
    let replyText = '';

    for (const model of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
          }),
        });

        const data = await res.json();

        if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          replyText = data.candidates[0].content.parts[0].text;
          break;
        } else {
          lastError = data?.error || { message: `Model ${model} returned status ${res.status}` };
          if (res.status === 404) continue;
          continue;
        }
      } catch (fetchErr: any) {
        lastError = fetchErr;
      }
    }

    if (!replyText) {
      console.error('Gemini API call failed across models:', lastError);
      return NextResponse.json(
        {
          success: false,
          error: lastError?.message || 'Gemini service is temporarily unavailable. Please try again shortly.',
        },
        { status: 502 }
      );
    }

    // Persist conversation and messages in Supabase if student is authenticated
    if (user) {
      try {
        let activeConvoId = conversationId;
        if (!activeConvoId) {
          const { data: newConvo } = await supabase
            .from('nova_conversations')
            .insert({
              student_id: user.id,
              subject_name: subject,
              title: `${subject} Session`,
            })
            .select()
            .maybeSingle();

          activeConvoId = newConvo?.id;
        }

        if (activeConvoId) {
          const latestUserMsg = messages[messages.length - 1];
          await supabase.from('nova_messages').insert([
            {
              conversation_id: activeConvoId,
              sender: 'user',
              text: latestUserMsg.text,
              action_type: actionType || null,
              language,
            },
            {
              conversation_id: activeConvoId,
              sender: 'nova',
              text: replyText,
              action_type: actionType || null,
              language,
            },
          ]);
        }
      } catch (dbErr) {
        console.warn('Nova conversation persistence warning (handled gracefully):', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      reply: replyText,
    });
  } catch (err: any) {
    console.error('Nova AI route error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process conversation with Nova AI.',
        details: err.message,
      },
      { status: 500 }
    );
  }
}
