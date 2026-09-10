// app/api/ai/nova/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface Message {
  role?: 'user' | 'model' | 'nova';
  sender?: 'user' | 'nova' | 'model';
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

    // Secure server-side API key retrieval (never exposed to client)
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_KEY;

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

    const latestUserMsg = messages[messages.length - 1];
    const userPromptText = latestUserMsg?.text || '';

    // Linguistic Auto-Detection: Devanagari Hindi vs Romanized Hinglish vs English
    const hasDevanagari = /[\u0900-\u097F]/.test(userPromptText);
    const hinglishPattern = /\b(kya|kaise|kyun|kyu|hai|hain|bhai|yaar|samjha|samjhao|samjhe|samajh|batao|bataiye|karo|karein|karna|krna|hoga|hogi|hoti|hota|iska|iski|iske|isme|usme|wala|wali|wale|aur|nahi|nhi|chahiye|bol|bolo|batayein|sikh|sikhao|achha|theek|thik|bata|btao|kese|sir|dost)\b/i;
    const hasHinglish = !hasDevanagari && hinglishPattern.test(userPromptText);

    let detectedMode: 'devanagari' | 'hinglish' | 'english' = 'english';
    if (hasDevanagari) {
      detectedMode = 'devanagari';
    } else if (hasHinglish) {
      detectedMode = 'hinglish';
    } else if (studentContext.language === 'hi') {
      detectedMode = 'hinglish';
    }

    if (!apiKey) {
      // Return student-friendly configuration message without throwing crashes
      let configMsg = "Nova AI is currently configuring its neural cortex. Please verify GEMINI_API_KEY in the environment settings.";
      if (detectedMode === 'hinglish') {
        configMsg = "Nova AI ka neural cortex configure ho raha hai. Please server environment me GEMINI_API_KEY check karein.";
      } else if (detectedMode === 'devanagari') {
        configMsg = "नोवा AI का न्यूरल कॉर्टेक्स कॉन्फ़िगर हो रहा है। कृपया सर्वर सेटिंग्स में GEMINI_API_KEY जांचें।";
      }

      return NextResponse.json(
        {
          success: false,
          error: configMsg,
          code: 'KEY_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Compose personalized pedagogical system prompt
    const studentName = studentContext.studentName || 'Student';
    const level = studentContext.level || 1;
    const subject = studentContext.currentSubject || 'General Academics';
    const language = studentContext.language || 'en';
    const actionType = studentContext.actionType;

    const weakTopicsStr = studentContext.weakTopics && studentContext.weakTopics.length > 0
      ? `The student has currently identified focus areas in: ${studentContext.weakTopics.join(', ')}.`
      : '';

    let languageInstruction = '';
    if (detectedMode === 'devanagari') {
      languageInstruction = `CRITICAL LANGUAGE & SCRIPT DIRECTIVE:
- The student is communicating in Hindi script (Devanagari).
- YOU MUST RESPOND IN NATURAL, CLEAR, AND ENCOURAGING HINDI (हिंदी).
- Keep core technical and academic concepts crystal clear by providing English technical terms in parentheses (e.g., "द्विघात समीकरण (Quadratic Equation)", "मूल (Roots)", "विविक्तकर (Discriminant)").
- Use an inspiring, friendly, and motivating mentor tone.`;
    } else if (detectedMode === 'hinglish') {
      languageInstruction = `CRITICAL LANGUAGE & SCRIPT DIRECTIVE:
- The student is communicating in Romanized Hinglish (e.g. "Bhai quadratic equation ka formula simple way me samjha de", "Iska formula kya hai?", "Kaise solve karein?").
- YOU MUST RESPOND IN NATURAL, FRIENDLY, CONVERSATIONAL HINGLISH (Hindi written using the English alphabet).
- Keep all academic terms, formula names, variables, and math/science keywords in clear English (e.g. "Quadratic Equation", "Roots", "Discriminant", "Formula", "x² + bx + c = 0").
- Speak like an approachable, super smart, encouraging Indian study mentor / elder brother (e.g., "Arre bilkul! Quadratic equation samajhna bohot aasan hai. Dekho...", "Iska standard form hota hai...").
- Keep sentences smooth, lively, and easy to read.`;
    } else {
      languageInstruction = `CRITICAL LANGUAGE & SCRIPT DIRECTIVE:
- The student is communicating in English.
- YOU MUST RESPOND IN CLEAR, ENGAGING, ENCOURAGING, AND SUPPORTIVE ACADEMIC ENGLISH.
- Break down concepts step-by-step with vivid intuition and structured explanations.`;
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
      actionInstruction = `CRITICAL: Provide ONE targeted practice problem matching Level ${level} with 4 multiple choice options (A, B, C, D). Ask the student to pick the right option.`;
    } else if (actionType === 'quiz') {
      actionInstruction = 'CRITICAL: Formulate a mini-quiz with 2 progressive questions to test conceptual understanding.';
    }

    const systemPrompt = `You are Nova, the intelligent, friendly, and adaptive 3D study mentor on the Smart Edu platform.
You are tutoring ${studentName}, who is currently at Level ${level}, focusing on ${subject}.
${weakTopicsStr}

Language Directive:
${languageInstruction}

Special Action Directive:
${actionInstruction || 'Provide a step-by-step, engaging explanation with intuitive logic, clear formulas, and an interactive check-in question.'}

Core Tutoring Principles:
1. Explain academic concepts step-by-step with intuitive clarity, using real-world analogies and visual descriptions.
2. If the student asks for a formula or concept (like Quadratic Equations), state the standard equation clearly (e.g. ax² + bx + c = 0), explain what each variable means, state the formula (e.g. x = (-b ± √(b² - 4ac)) / (2a)), and walk through a quick, intuitive example.
3. If the student asks a follow-up question (e.g. "Iska formula kya hai?", "Why does this happen?", "Give an example"), understand that "iska" refers to the concept discussed in the immediately preceding turns.
4. If the student attempts an answer, evaluate it constructively, highlighting what they did right before gently guiding corrections.
5. Keep explanations structured, easy to digest, and visually neat using Markdown formatting (bullet points, bolding, formula notation).
6. Never repeat generic greetings once a conversation is underway.
7. Always stay in character as a motivating, warm, and supportive AI study mentor.
8. Ground all academic steps in accurate mathematical and scientific facts — never fabricate incorrect steps.`;

    // Format conversation history for Gemini API (max 12 recent turns)
    const recentMessages = messages.slice(-12);
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const msg of recentMessages) {
      const isUser = msg.role === 'user' || msg.sender === 'user';
      const geminiRole: 'user' | 'model' = isUser ? 'user' : 'model';
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

    // Call Gemini API using active GA models (gemini-2.5-flash, gemini-2.5-flash-lite, gemini-1.5-flash)
    // Note: retired gemini-2.0-flash has been completely removed.
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];
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
          if (res.status === 404 || res.status === 400) continue;
          continue;
        }
      } catch (fetchErr: any) {
        lastError = fetchErr;
      }
    }

    if (!replyText) {
      console.error('Gemini API call failed across models:', lastError?.message || lastError);

      // Safe, student-friendly fallback response (never expose raw API/model error internals)
      let studentFacingFallback = "I'm having a brief connection pause with my knowledge cortex. Let's try asking that question again in a moment!";
      if (detectedMode === 'hinglish') {
        studentFacingFallback = "Thoda sa connection issue ho gaya tha mere knowledge cortex ke sath. Ek baar phirse pooch ke dekho, mai abhi solve karta hu!";
      } else if (detectedMode === 'devanagari') {
        studentFacingFallback = "नॉलेज कॉर्टेक्स से संपर्क में थोड़ी समस्या आ रही है। कृपया एक क्षण बाद पुनः पूछें!";
      }

      return NextResponse.json(
        {
          success: false,
          error: studentFacingFallback,
        },
        { status: 502 }
      );
    }

    // Non-blocking fire-and-forget conversation persistence in Supabase
    // This allows the response to return to the student immediately without waiting for DB writes
    if (user) {
      (async () => {
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
            await supabase.from('nova_messages').insert([
              {
                conversation_id: activeConvoId,
                sender: 'user',
                text: userPromptText,
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
          console.warn('Nova non-blocking persistence warning:', dbErr);
        }
      })();
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
        error: 'Nova is momentarily resetting. Please try asking again in a few seconds.',
      },
      { status: 500 }
    );
  }
}
