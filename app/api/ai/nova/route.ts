// app/api/ai/nova/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';

interface Message {
  role?: 'user' | 'model' | 'nova';
  sender?: 'user' | 'nova' | 'model';
  text: string;
}

interface StudentContext {
  studentName?: string;
  level?: number;
  grade?: string;
  board?: string;
  currentSubject?: string;
  currentChapter?: string;
  currentTopic?: string;
  topicMastery?: number;
  weakTopics?: string[];
  learningPreferences?: string[];
  supportSignals?: string[];
  language?: 'en' | 'hi';
  actionType?: 'explain_10' | 'simplify' | 'example' | 'hint' | 'practice' | 'quiz' | string;
}

export const dynamic = 'force-dynamic';

// GET: Server-side health check verifying environment variable, SDK initialization, and connectivity
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        status: 'offline',
        configured: false,
        model: 'gemini-2.5-flash',
        sdk: '@google/genai',
        message: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your deployment environment.',
      },
      { status: 503 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Lightweight verification call
    const testResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'ping',
      config: {
        maxOutputTokens: 10,
        temperature: 0.1,
      },
    });

    const isHealthy = !!testResponse?.text;

    return NextResponse.json({
      status: isHealthy ? 'online' : 'degraded',
      configured: true,
      model: 'gemini-2.5-flash',
      sdk: '@google/genai',
      message: isHealthy 
        ? 'Nova AI neural cortex is active, connected to Gemini 2.5 Flash.'
        : 'Gemini client connected, but response was empty.',
    });
  } catch (err: any) {
    console.error('Nova AI health check error:', err?.message || err);
    return NextResponse.json(
      {
        status: 'offline',
        configured: true,
        model: 'gemini-2.5-flash',
        sdk: '@google/genai',
        error: err?.message || 'Failed to communicate with Gemini API',
        message: 'Gemini API key is set, but the API request failed. Verify key permissions or quota.',
      },
      { status: 502 }
    );
  }
}

// POST: Authenticated, context-rich personalized study companion query
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
      let configMsg = "Nova AI cortex is currently awaiting GEMINI_API_KEY on the server. Please configure GEMINI_API_KEY in your environment variables.";
      if (detectedMode === 'hinglish') {
        configMsg = "Nova AI cortex ko server par GEMINI_API_KEY ki zaroorat hai. Please environment variables me GEMINI_API_KEY set karein.";
      } else if (detectedMode === 'devanagari') {
        configMsg = "नोवा AI कॉर्टेक्स को सर्वर पर GEMINI_API_KEY की आवश्यकता है। कृपया एनवायरनमेंट सेटिंग्स में GEMINI_API_KEY सेट करें।";
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

    // 2. Load deep student learning context from Supabase (if authenticated)
    let deepContext = {
      grade: studentContext.grade || '10th',
      board: studentContext.board || 'CBSE',
      learningPreferences: studentContext.learningPreferences || ['visual', 'practice'],
      supportSignals: studentContext.supportSignals || [],
      currentSubject: studentContext.currentSubject || 'Mathematics',
      currentTopic: studentContext.currentTopic || 'Quadratic Equations',
      topicMastery: studentContext.topicMastery ?? 54,
      weakTopics: studentContext.weakTopics || [],
      recentMistakes: [] as string[],
      wellbeingSignal: '',
    };

    if (user) {
      try {
        const [profileRes, masteryRes, weakRes, attemptsRes, wellbeingRes] = await Promise.all([
          supabase.from('student_profiles').select('grade, board, preferred_language, learning_preferences, support_signals, learning_pace').eq('id', user.id).maybeSingle(),
          supabase.from('topic_mastery').select('mastery_level, topics(name, subjects(name))').eq('student_id', user.id).order('mastery_level', { ascending: true }).limit(3),
          supabase.from('weak_topics').select('topic_name, reason').eq('student_id', user.id).limit(3),
          supabase.from('quiz_attempts').select('score, answers').eq('student_id', user.id).order('created_at', { ascending: false }).limit(2),
          supabase.from('wellbeing_signals').select('energy_level, emotional_state').eq('student_id', user.id).order('created_at', { ascending: false }).limit(1),
        ]);

        if (profileRes.data) {
          if (profileRes.data.grade) deepContext.grade = profileRes.data.grade;
          if (profileRes.data.board) deepContext.board = profileRes.data.board;
          if (profileRes.data.learning_preferences?.length) deepContext.learningPreferences = profileRes.data.learning_preferences;
          if (profileRes.data.support_signals?.length) deepContext.supportSignals = profileRes.data.support_signals;
        }

        if (masteryRes.data && masteryRes.data.length > 0) {
          const topMastery = masteryRes.data[0];
          if ((topMastery as any).topics?.name) {
            deepContext.currentTopic = (topMastery as any).topics.name;
          }
          if ((topMastery as any).topics?.subjects?.name) {
            deepContext.currentSubject = (topMastery as any).topics.subjects.name;
          }
          deepContext.topicMastery = topMastery.mastery_level;
        }

        if (weakRes.data && weakRes.data.length > 0) {
          deepContext.weakTopics = weakRes.data.map(w => w.topic_name);
        }

        if (attemptsRes.data && attemptsRes.data.length > 0) {
          const mistakes: string[] = [];
          for (const att of attemptsRes.data) {
            if (Array.isArray(att.answers)) {
              for (const a of att.answers) {
                if (a && a.is_correct === false && a.topic) {
                  mistakes.push(`${a.topic}: ${a.student_answer || 'incorrect response'}`);
                }
              }
            }
          }
          deepContext.recentMistakes = mistakes.slice(0, 3);
        }

        if (wellbeingRes.data && wellbeingRes.data.length > 0) {
          deepContext.wellbeingSignal = `Energy: ${wellbeingRes.data[0].energy_level}, Mood: ${wellbeingRes.data[0].emotional_state}`;
        }
      } catch (err) {
        console.warn('Could not load auxiliary student context for Nova (proceeding gracefully):', err);
      }
    }

    // Compose personalized pedagogical system prompt
    const studentName = studentContext.studentName || 'Student';
    const level = studentContext.level || 1;
    const actionType = studentContext.actionType;

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

    const learningStyleAdvice = deepContext.learningPreferences.includes('visual')
      ? 'Pedagogy: Student is a Visual Learner. Use ASCII/Markdown visual mental models, flow diagrams, step boxes, and visual spatial analogies.'
      : 'Pedagogy: Student is a Practice Learner. Provide concise concept intuition and immediately ground it in worked mathematical problems.';

    const systemPrompt = `You are Nova, the intelligent, friendly, and adaptive 3D study companion on the Smart Edu platform.
You are tutoring ${studentName}, a Grade ${deepContext.grade} (${deepContext.board} curriculum) learner currently at Level ${level}.

Current Subject: ${deepContext.currentSubject}
Current Topic: ${deepContext.currentTopic} (Mastery: ${deepContext.topicMastery}%)
Identified Weak Topics: ${deepContext.weakTopics.length ? deepContext.weakTopics.join(', ') : 'None currently flagged'}
${deepContext.recentMistakes.length ? `Recent Student Mistakes: ${deepContext.recentMistakes.join('; ')}` : ''}
${deepContext.wellbeingSignal ? `Learner State: ${deepContext.wellbeingSignal}` : ''}
${learningStyleAdvice}

Language Directive:
${languageInstruction}

Special Action Directive:
${actionInstruction || 'Provide a step-by-step, engaging explanation with intuitive logic, clear formulas, and an interactive check-in question.'}

Core Companion Rules:
1. Explain academic concepts step-by-step with intuitive clarity, using real-world analogies and visual descriptions.
2. If the student asks for a formula or concept (like Quadratic Equations), state the standard equation clearly (e.g. ax² + bx + c = 0), explain what each variable means, state the formula (e.g. x = (-b ± √(b² - 4ac)) / (2a)), and walk through a quick, intuitive example.
3. CONVERSATION CONTEXT & FOLLOW-UPS: Always maintain continuous memory of recent turns. If the student asks "like what?", "give me one", "why am I getting this wrong?", or "can you recall all important formulae", understand they are referring to the current topic (${deepContext.currentTopic}) and previous discussion.
4. If the student attempts an answer, evaluate it constructively, highlighting what they did right before gently guiding corrections.
5. If the student says "I don't understand", NEVER repeat the exact same text. Change your analogy, break down the root component, and try a different angle.
6. Keep explanations structured, easy to digest, and visually neat using Markdown formatting (bullet points, bolding, formula notation).
7. Ground all academic steps in accurate mathematical and scientific facts — never fabricate incorrect steps.`;

    // Format conversation history for @google/genai
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

    // Execute server-side Gemini request via official @google/genai SDK
    const ai = new GoogleGenAI({ apiKey });
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];
    let lastError: any = null;
    let replyText = '';
    let usedModel = '';

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
            maxOutputTokens: 1200,
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
        console.warn(`Model ${model} attempt encountered:`, sdkErr?.message || sdkErr);
      }
    }

    if (!replyText) {
      const rawErrMsg = lastError?.message || 'Gemini service encountered an error';
      console.error('Gemini API call failed across models:', rawErrMsg);

      // Truthful error classification
      let studentFacingError = 'Nova AI is momentarily unable to reach Gemini services. Please try again.';
      if (rawErrMsg.includes('API_KEY_INVALID') || rawErrMsg.includes('403') || rawErrMsg.includes('PERMISSION_DENIED')) {
        studentFacingError = 'The configured Gemini API key is invalid or lacks required permissions.';
      } else if (rawErrMsg.includes('RESOURCE_EXHAUSTED') || rawErrMsg.includes('429')) {
        studentFacingError = 'Gemini API quota rate limit reached. Please wait a few seconds before asking again.';
      } else if (rawErrMsg.includes('NOT_FOUND') || rawErrMsg.includes('404')) {
        studentFacingError = 'Selected Gemini model is currently not supported for this account.';
      }

      return NextResponse.json(
        {
          success: false,
          error: studentFacingError,
          rawError: process.env.NODE_ENV === 'development' ? rawErrMsg : undefined,
        },
        { status: 502 }
      );
    }

    // Non-blocking fire-and-forget conversation persistence in Supabase
    if (user) {
      (async () => {
        try {
          let activeConvoId = conversationId;
          if (!activeConvoId) {
            const { data: newConvo } = await supabase
              .from('nova_conversations')
              .insert({
                student_id: user.id,
                subject_name: deepContext.currentSubject,
                title: `${deepContext.currentTopic} Session`,
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
                language: studentContext.language || 'en',
              },
              {
                conversation_id: activeConvoId,
                sender: 'nova',
                text: replyText,
                action_type: actionType || null,
                language: studentContext.language || 'en',
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
      model: usedModel,
    });
  } catch (err: any) {
    console.error('Nova AI route general error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Nova is momentarily resetting. Please try asking again in a few seconds.',
      },
      { status: 500 }
    );
  }
}

