// app/api/ai/nova/route.ts
import { NextResponse, type NextRequest } from 'next/server';

interface Message {
  role: 'user' | 'model' | 'nova';
  text: string;
}

interface StudentContext {
  studentName?: string;
  level?: number;
  currentSubject?: string;
  weakTopics?: string[];
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'GEMINI_API_KEY is not configured on the server. Please verify that GEMINI_API_KEY is set in your Render environment variables.',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { messages = [], studentContext = {} }: { messages: Message[]; studentContext: StudentContext } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one message is required.' },
        { status: 400 }
      );
    }

    // Compose system instruction incorporating student context
    const studentName = studentContext.studentName || 'Student';
    const level = studentContext.level || 1;
    const subject = studentContext.currentSubject || 'General Academics';
    const weakTopicsStr = studentContext.weakTopics && studentContext.weakTopics.length > 0
      ? `The student currently has identified weak areas in: ${studentContext.weakTopics.join(', ')}.`
      : '';

    const systemPrompt = `You are Nova, the intelligent, friendly, and adaptive 3D study mentor on the Smart Edu platform.
You are tutoring ${studentName}, who is currently at Level ${level}, focusing on ${subject}.
${weakTopicsStr}

Your tutoring principles:
1. Explain academic concepts step-by-step with intuitive clarity, using real-world analogies and visual descriptions.
2. If the student asks for practice questions, provide 3 to 5 targeted questions with varying difficulty.
3. If the student provides an answer, check it constructively, pointing out strengths and giving subtle hints for mistakes before revealing full solutions.
4. Keep explanations concise, engaging, and motivating. Use Markdown formatting (bolding, lists, and formula notation like ax² + bx + c = 0) to make answers easily readable.
5. Always maintain context from earlier turns in the conversation. Never repeat generic greetings once a conversation is underway.`;

    // Format conversation history for Gemini API (max 10 recent turns to conserve tokens & latency)
    const recentMessages = messages.slice(-10);
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const msg of recentMessages) {
      const geminiRole = msg.role === 'user' ? 'user' : 'model';
      // Ensure alternating roles and valid content
      if (!msg.text || !msg.text.trim()) continue;

      if (contents.length > 0 && contents[contents.length - 1].role === geminiRole) {
        // Merge consecutive messages with the same role
        contents[contents.length - 1].parts[0].text += `\n\n${msg.text.trim()}`;
      } else {
        contents.push({
          role: geminiRole,
          parts: [{ text: msg.text.trim() }],
        });
      }
    }

    // Ensure first message has role 'user'
    if (contents.length > 0 && contents[0].role !== 'user') {
      contents.shift();
    }

    if (contents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid user messages found in history.' },
        { status: 400 }
      );
    }

    // Attempt generation with gemini-2.5-flash, fallback to gemini-1.5-flash if needed
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
