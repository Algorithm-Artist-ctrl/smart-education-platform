// lib/ai/student-context-builder.ts
// Builds structured, performance-aware context and system instructions for the student's personal AI partner

import { SupabaseClient } from '@supabase/supabase-js';

export interface RuntimeStudentContext {
  studentName?: string;
  level?: number;
  grade?: string;
  board?: string;
  currentSubject?: string;
  currentTopic?: string;
  topicMastery?: number;
  weakTopics?: string[];
  language?: 'en' | 'hi' | 'hinglish';
  conversationStyle?: 'simple' | 'friendly' | 'hinglish' | 'detailed' | 'visual';
  actionType?: string;
  userPromptText?: string;
  recentMessages?: Array<{ role?: string; sender?: string; text?: string }>;
}

export interface ResolvedStudentContext {
  studentId: string;
  studentName: string;
  aiPartnerName: string;
  preferredLanguage: 'en' | 'hi' | 'hinglish';
  conversationStyle: 'simple' | 'friendly' | 'hinglish' | 'detailed' | 'visual';
  explanationStyle: string;
  interactionPreferences: {
    hint_first?: boolean;
    show_examples?: boolean;
    challenge_mode?: boolean;
    auto_practice?: boolean;
    [key: string]: any;
  };
  learningMemory: {
    common_mistakes?: string[];
    memorized_facts?: string[];
    focus_topics?: string[];
    learning_habits?: string[];
    [key: string]: any;
  };
  grade: string;
  board: string;
  level: number;
  xp: number;
  streak: number;
  currentSubject: string;
  currentTopic: string;
  topicMastery: number;
  weakTopics: string[];
  strengths: string[];
  recentMistakes: string[];
  wellbeingSignal: string;
  actionType?: string;
  detectedMode: 'devanagari' | 'hinglish' | 'english';
}

/**
 * Heuristic topic and subject inference from conversational turns.
 */
function inferTopicFromText(text: string): { topic: string; subject: string } | null {
  const lower = text.toLowerCase();

  if (/quadratic|parabola|discriminant|ax\^2|x\^2|roots of equation/.test(lower)) {
    return { topic: 'Quadratic Equations', subject: 'Mathematics' };
  }
  if (/trigonometr|sin\(|cos\(|tan\(|sin\^2|cos\^2|hypotenuse/.test(lower)) {
    return { topic: 'Trigonometry', subject: 'Mathematics' };
  }
  if (/pythagor|theorem|geometry|circle|perimeter|area of|volume of|triangle/.test(lower)) {
    return { topic: 'Geometry & Mensuration', subject: 'Mathematics' };
  }
  if (/linear equation|algebra|polynomial|factori[zs]ation/.test(lower)) {
    return { topic: 'Algebra', subject: 'Mathematics' };
  }
  if (/newton|inertia|force|friction|momentum|laws of motion|velocity|acceleration/.test(lower)) {
    return { topic: 'Laws of Motion', subject: 'Physics' };
  }
  if (/light|refraction|reflection|lens|prism|mirror|focal length/.test(lower)) {
    return { topic: 'Light - Reflection & Refraction', subject: 'Physics' };
  }
  if (/gravity|gravitation|free fall|weight vs mass/.test(lower)) {
    return { topic: 'Gravitation', subject: 'Physics' };
  }
  if (/electricity|circuit|ohm's law|current|voltage|resistance/.test(lower)) {
    return { topic: 'Electricity & Circuits', subject: 'Physics' };
  }
  if (/photo-?synthesis|chlorophyll|cell|respiration|dna|mitochondria|biology|heart|circulation/.test(lower)) {
    return { topic: 'Life Processes & Biology', subject: 'Biology' };
  }
  if (/atom|molecule|chemical reaction|acid|base|ph scale|periodic table|oxidation/.test(lower)) {
    return { topic: 'Chemical Reactions & Matter', subject: 'Chemistry' };
  }
  if (/python|code|variable|loop|array|function|algorithm|queue|stack|binary search/.test(lower)) {
    return { topic: 'Python Fundamentals & Data Structures', subject: 'Computer Science' };
  }

  return null;
}

/**
 * Reads verified student records from Supabase and merges them with runtime context.
 */
export async function buildStudentLearningContext(
  supabase: SupabaseClient,
  studentId: string | null,
  runtime: RuntimeStudentContext
): Promise<ResolvedStudentContext> {
  const userPrompt = runtime.userPromptText || '';

  // Linguistic Auto-Detection
  const hasDevanagari = /[\u0900-\u097F]/.test(userPrompt);
  const hinglishPattern = /\b(kya|kaise|kyun|kyu|hai|hain|bhai|yaar|samjha|samjhao|samjhe|samajh|batao|bataiye|karo|karein|karna|krna|hoga|hogi|hoti|hota|iska|iski|iske|isme|usme|wala|wali|wale|aur|nahi|nhi|chahiye|bol|bolo|batayein|sikh|sikhao|achha|theek|thik|bata|btao|kese|sir|dost|bta|acha)\b/i;
  const hasHinglish = !hasDevanagari && hinglishPattern.test(userPrompt);

  let detectedMode: 'devanagari' | 'hinglish' | 'english' = 'english';
  if (hasDevanagari) {
    detectedMode = 'devanagari';
  } else if (hasHinglish) {
    detectedMode = 'hinglish';
  } else if (runtime.language === 'hi' || runtime.conversationStyle === 'hinglish') {
    detectedMode = 'hinglish';
  }

  // Dynamic Topic Resolution
  let resolvedTopic = runtime.currentTopic;
  let resolvedSubject = runtime.currentSubject;

  // 1. Check current prompt
  const directInference = inferTopicFromText(userPrompt);
  if (directInference) {
    resolvedTopic = directInference.topic;
    resolvedSubject = directInference.subject;
  } else if (runtime.recentMessages && runtime.recentMessages.length > 0) {
    // 2. Scan recent conversation messages backwards for topic context
    for (let i = runtime.recentMessages.length - 1; i >= 0; i--) {
      const msgText = runtime.recentMessages[i].text || '';
      const priorInference = inferTopicFromText(msgText);
      if (priorInference) {
        resolvedTopic = priorInference.topic;
        resolvedSubject = priorInference.subject;
        break;
      }
    }
  }

  // Base fallback defaults
  const resolved: ResolvedStudentContext = {
    studentId: studentId || '',
    studentName: runtime.studentName || 'Cadet',
    aiPartnerName: 'Nova',
    preferredLanguage: runtime.language || 'en',
    conversationStyle: runtime.conversationStyle || 'friendly',
    explanationStyle: 'examples',
    interactionPreferences: { hint_first: true, show_examples: true },
    learningMemory: { common_mistakes: [], memorized_facts: [], focus_topics: [], learning_habits: [] },
    grade: runtime.grade || '10th',
    board: runtime.board || 'CBSE',
    level: runtime.level || 1,
    xp: 0,
    streak: 0,
    currentSubject: resolvedSubject || runtime.currentSubject || 'General Academics',
    currentTopic: resolvedTopic || runtime.currentTopic || 'Academic Concepts',
    topicMastery: runtime.topicMastery ?? 60,
    weakTopics: runtime.weakTopics || [],
    strengths: [],
    recentMistakes: [],
    wellbeingSignal: '',
    actionType: runtime.actionType,
    detectedMode,
  };

  if (!studentId) {
    return resolved;
  }

  try {
    const [
      aiProfileRes,
      studentProfileRes,
      profileRes,
      masteryRes,
      weakRes,
      attemptsRes,
      diagRes,
      wellbeingRes,
    ] = await Promise.all([
      supabase.from('student_ai_profiles').select('*').eq('student_id', studentId).maybeSingle(),
      supabase.from('student_profiles').select('grade, board, level, total_points, current_streak, preferred_language, learning_preferences, support_signals, strengths, ai_partner_name').eq('id', studentId).maybeSingle(),
      supabase.from('profiles').select('full_name').eq('id', studentId).maybeSingle(),
      supabase.from('topic_mastery').select('mastery_score, status, topic:topics(name, subject:subjects(name))').eq('student_id', studentId).order('updated_at', { ascending: false }).limit(5),
      supabase.from('weak_topics').select('topic:topics(name)').eq('student_id', studentId).eq('status', 'active').limit(3),
      supabase.from('quiz_attempts').select('score, percentage, answers').eq('student_id', studentId).order('created_at', { ascending: false }).limit(3),
      supabase.from('diagnostic_results').select('identified_strengths, identified_support_signals').eq('student_id', studentId).order('completed_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('wellbeing_signals').select('feeling').eq('student_id', studentId).eq('recorded_date', new Date().toISOString().split('T')[0]).maybeSingle(),
    ]);

    if (profileRes.data?.full_name) {
      resolved.studentName = profileRes.data.full_name.split(' ')[0];
    }

    if (studentProfileRes.data) {
      const sp = studentProfileRes.data;
      if (sp.grade) resolved.grade = sp.grade;
      if (sp.board) resolved.board = sp.board;
      if (sp.level) resolved.level = sp.level;
      if (sp.total_points) resolved.xp = sp.total_points;
      if (sp.current_streak) resolved.streak = sp.current_streak;
      if (sp.ai_partner_name) resolved.aiPartnerName = sp.ai_partner_name;
      if (sp.strengths?.length) resolved.strengths = sp.strengths;
    }

    if (aiProfileRes.data) {
      const ai = aiProfileRes.data;
      if (ai.ai_partner_name) resolved.aiPartnerName = ai.ai_partner_name;
      if (ai.preferred_language) resolved.preferredLanguage = ai.preferred_language;
      if (ai.conversation_style) resolved.conversationStyle = ai.conversation_style;
      if (ai.explanation_style) resolved.explanationStyle = ai.explanation_style;
      if (ai.interaction_preferences) resolved.interactionPreferences = ai.interaction_preferences;
      if (ai.learning_memory) resolved.learningMemory = ai.learning_memory;

      // Honor saved language preference if user prompt doesn't explicitly override
      if (!hasDevanagari && !hasHinglish) {
        if (ai.preferred_language === 'hi') resolved.detectedMode = 'devanagari';
        else if (ai.preferred_language === 'hinglish' || ai.conversation_style === 'hinglish') resolved.detectedMode = 'hinglish';
        else resolved.detectedMode = 'english';
      }
    }

    // Match topic mastery if a specific topic was detected or passed
    if (masteryRes.data && masteryRes.data.length > 0) {
      if (resolvedTopic) {
        const match: any = masteryRes.data.find(
          (m: any) => m.topic?.name?.toLowerCase() === resolvedTopic?.toLowerCase() ||
                      resolvedTopic?.toLowerCase().includes(m.topic?.name?.toLowerCase())
        );
        if (match) {
          resolved.topicMastery = Number(match.mastery_score) || 0;
          const matchSubj = match.topic?.subject?.name || match.topic?.subject?.[0]?.name;
          if (matchSubj) resolved.currentSubject = matchSubj;
        }
      } else {
        const top = masteryRes.data[0] as any;
        if (top.topic?.name) resolved.currentTopic = top.topic.name;
        const topSubj = top.topic?.subject?.name || top.topic?.subject?.[0]?.name;
        if (topSubj) resolved.currentSubject = topSubj;
        resolved.topicMastery = Number(top.mastery_score) || 0;
      }
    }

    if (weakRes.data && weakRes.data.length > 0) {
      resolved.weakTopics = weakRes.data.map((w: any) => w.topic?.name).filter(Boolean);
    }

    if (diagRes.data?.identified_strengths?.length) {
      resolved.strengths = Array.from(new Set([...resolved.strengths, ...diagRes.data.identified_strengths]));
    }

    if (attemptsRes.data && attemptsRes.data.length > 0) {
      const mistakes: string[] = [];
      for (const att of attemptsRes.data) {
        if (Array.isArray(att.answers)) {
          for (const a of att.answers) {
            if (a && a.is_correct === false) {
              mistakes.push(`${a.topic || resolved.currentTopic}: answered ${a.student_answer || 'incorrectly'}`);
            }
          }
        }
      }
      resolved.recentMistakes = mistakes.slice(0, 3);
    }

    if (wellbeingRes.data?.feeling) {
      resolved.wellbeingSignal = `Today's learning state: feeling ${wellbeingRes.data.feeling}`;
    }
  } catch (err) {
    console.warn('[Context Builder] Error reading auxiliary student context:', err);
  }

  return resolved;
}

/**
 * Constructs the pedagogical system prompt customized to the student and their chosen partner name.
 */
export function constructSystemPrompt(ctx: ResolvedStudentContext): string {
  const {
    studentName,
    aiPartnerName,
    grade,
    board,
    level,
    currentSubject,
    currentTopic,
    topicMastery,
    weakTopics,
    strengths,
    recentMistakes,
    interactionPreferences,
    learningMemory,
    conversationStyle,
    detectedMode,
    actionType,
  } = ctx;

  // Language & Persona Directives
  let languageDirective = '';
  if (detectedMode === 'devanagari') {
    languageDirective = `CRITICAL SCRIPT & LANGUAGE DIRECTIVE:
- The student prefers Hindi script (Devanagari).
- YOU MUST RESPOND IN NATURAL, ENCOURAGING HINDI (हिंदी).
- Keep core technical and academic concepts crystal clear by providing English technical terms in parentheses (e.g. "द्विघात समीकरण (Quadratic Equation)", "गुणनखंड (Factorization)", "मूल (Roots)").
- Tone: Inspiring, friendly, supportive personal study partner.`;
  } else if (detectedMode === 'hinglish') {
    languageDirective = `CRITICAL SCRIPT & LANGUAGE DIRECTIVE:
- The student communicates in Romanized Hinglish (e.g. "Bhai quadratic equation samjha de", "Iska formula kya hai?", "Example de").
- YOU MUST RESPOND IN NATURAL, WARM, CONVERSATIONAL HINGLISH (Hindi written using the English alphabet).
- Keep all academic terms, formula names, variables, and math/science keywords in clear English (e.g. "Quadratic Equation", "Roots", "Discriminant", "Formula", "x² + bx + c = 0").
- Speak like a super smart, encouraging Indian study buddy / elder sibling: friendly, accessible, never overly formal.
- Example phrasing: "Arre bilkul! Quadratic equations ko simple way mein samajhte hain. Dekho standard form hota hai..."`;
  } else {
    languageDirective = `CRITICAL SCRIPT & LANGUAGE DIRECTIVE:
- The student is communicating in English.
- YOU MUST RESPOND IN CLEAR, ENGAGING, SUPPORTIVE, AND RIGOROUS ACADEMIC ENGLISH.
- Structure explanations with clear bullet points, intuitive logic, and visual metaphors.`;
  }

  // Performance-Aware Teaching Calibration
  let performanceBracket = '';
  if (topicMastery < 50) {
    performanceBracket = `PERFORMANCE CALIBRATION: FOUNDATIONAL & GUIDED (Mastery: ${topicMastery}% < 50%)
- The student is finding this topic challenging or is beginning from the fundamentals.
- ALWAYS start from core concepts with a concrete, everyday real-world analogy.
- Break explanations into bite-sized steps (1-2 sentences each).
- When giving practice questions, choose accessible, foundational problems that build confidence.
- Provide gentle scaffolds and hints; never rush into abstract notation.`;
  } else if (topicMastery <= 75) {
    performanceBracket = `PERFORMANCE CALIBRATION: INTERMEDIATE REINFORCEMENT (Mastery: ${topicMastery}% [50-75%])
- The student understands the basics but needs targeted practice and misconception correction.
- Emphasize worked examples, step-by-step formula applications, and intermediate practice problems.
- Address typical pitfalls (like sign errors, algebraic rearrangement, or misapplying formulas).`;
  } else {
    performanceBracket = `PERFORMANCE CALIBRATION: ADVANCED MASTERY & CHALLENGE (Mastery: ${topicMastery}% > 75%)
- The student has demonstrated high competency in this topic!
- Skip repetitive foundational definitions.
- Challenge them with multi-step application problems, real-world edge cases, and cross-subject connections.
- Ask them to explain "why" the concept works to test deep intuitive mastery.`;
  }

  // Stated Interaction Preferences
  const hintFirst = interactionPreferences.hint_first !== false;
  const preferenceDirectives = [
    hintFirst ? '- HINT BEFORE ANSWER: If the student asks for help on a problem, provide a subtle guiding clue or hint first rather than immediately showing the complete final answer.' : '',
    interactionPreferences.show_examples !== false ? '- REAL-WORLD EXAMPLES: Ground concepts in relatable everyday examples.' : '',
    conversationStyle === 'simple' ? '- CONVERSATIONAL STYLE: Keep sentences short, concise, and direct with zero unnecessary filler.' : '',
    conversationStyle === 'visual' ? '- VISUAL LEARNING: Use ASCII/Markdown visual mental models, flow diagrams, and spatial analogies.' : '',
  ].filter(Boolean).join('\n');

  // Action-Specific Directive
  let actionDirective = '';
  if (actionType === 'explain_10' || actionType === 'explain_simple') {
    actionDirective = 'SPECIAL ACTION: Explain this concept simply and clearly in short, intuitive sentences. Use a vivid everyday analogy and zero unnecessary jargon.';
  } else if (actionType === 'simplify') {
    actionDirective = 'SPECIAL ACTION: Make your explanation as simple and straightforward as possible in 3 clear bullet points.';
  } else if (actionType === 'example') {
    actionDirective = 'SPECIAL ACTION: Provide a memorable, concrete real-world example illustrating this concept in action.';
  } else if (actionType === 'hint') {
    actionDirective = 'SPECIAL ACTION: Give a subtle, guiding hint to help the student solve the problem on their own. DO NOT give away the final answer.';
  } else if (actionType === 'practice') {
    actionDirective = `SPECIAL ACTION: Generate ONE targeted practice question on ${currentTopic} tailored to mastery level (${topicMastery}%). Include 4 multiple choice options (A, B, C, D) and ask the student to pick the answer. Do NOT reveal the solution yet.`;
  } else if (actionType === 'quiz') {
    actionDirective = `SPECIAL ACTION: Formulate a mini-quiz with 2 progressive conceptual questions on ${currentTopic}. Ask Question 1 first.`;
  } else if (actionType === 'visual') {
    actionDirective = 'SPECIAL ACTION: Explain this concept using vivid spatial mental models, ASCII diagrams, or visual physical analogies.';
  } else if (actionType === 'step_by_step') {
    actionDirective = 'SPECIAL ACTION: Walk through the solution step-by-step with clear numbered stages, explaining the logic of each step.';
  } else if (actionType === 'challenge') {
    actionDirective = `SPECIAL ACTION: Pose an advanced, thought-provoking challenge problem on ${currentTopic} that requires synthesis and creative problem solving.`;
  } else if (actionType === 'misconception' || actionType === 'why_wrong') {
    actionDirective = 'SPECIAL ACTION: Help the student diagnose where typical reasoning goes wrong. Explain the misconception constructively with zero judgment.';
  } else if (actionType === 'revise') {
    actionDirective = `SPECIAL ACTION: Provide a crisp 3-point revision summary of ${currentTopic} with key formulas and takeaways.`;
  } else if (actionType === 'why_am_i_learning_this') {
    actionDirective = `SPECIAL ACTION (WHY AM I LEARNING THIS): Explain where and why ${currentTopic} is used in the real world: engineering, computer games, space, architecture, sports, or daily life. Inspire the student!`;
  } else if (actionType === 'progress_analysis') {
    actionDirective = `SPECIAL ACTION: Provide an encouraging, honest overview of the student's progress based on real database numbers (Current mastery on ${currentTopic}: ${topicMastery}%, Streak: ${ctx.streak} days, Level: ${level}). Highlight strengths and suggest their next best action.`;
  }

  // Common Mistakes & Memory
  const memoryNotes = [
    learningMemory.common_mistakes?.length ? `Known Common Misconceptions: ${learningMemory.common_mistakes.join('; ')}` : '',
    recentMistakes.length ? `Recent Quiz Mistakes: ${recentMistakes.join('; ')}` : '',
    weakTopics.length ? `Flagged Support Topics: ${weakTopics.join(', ')}` : '',
    strengths.length ? `Demonstrated Strengths: ${strengths.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  return `You are ${aiPartnerName}, the personal, adaptive AI learning partner for ${studentName} on Smart Edu.
You are tutoring ${studentName}, a Grade ${grade} (${board} curriculum) student currently at Level ${level} (${ctx.xp} XP, ${ctx.streak} day streak).

Current Academic Anchor:
- Subject: ${currentSubject}
- Topic: ${currentTopic}
- Verified Topic Mastery: ${topicMastery}%
${memoryNotes}
${ctx.wellbeingSignal}

${performanceBracket}

${languageDirective}

Learner Preferences:
${preferenceDirectives}

${actionDirective ? `${actionDirective}\n` : ''}
Pedagogical Directives for Conversational Turns:
1. IDENTITY & PERSONA: Your name is ${aiPartnerName}. Act as ${studentName}'s personal study partner.
2. MULTI-TURN GROUNDING:
   - If the student asks a conversational follow-up like "like what?" or "give an example", provide a concrete, vivid example of the concept immediately preceding.
   - If the student asks "why x²?" or "why [term]?", explain the exact mathematical/conceptual reason.
   - If the student asks "give me practice" or "practice problem", generate 1 targeted practice problem matching their mastery level.
   - If the student says "I don't understand" or "easy way", switch teaching strategies immediately: drop jargon and use an everyday physical analogy.
   - If the student asks "formula?", give the relevant formulas with clear variable definitions.
   - If the student asks "test me", pose 1 interactive diagnostic question.
   - If the student asks "what did I get wrong?", examine their prior response constructively.
   - If the student asks "why am I learning this?", reveal real-world engineering, aerospace, video game, or medical applications.
   - If the student introduces a NEW subject or topic (e.g. Physics, Biology, History, Computer Science), seamlessly transition to that subject without forcing the previous anchor topic!
3. ZERO-SHAMING FEEDBACK: Never use words like "Wrong", "Failed", or "Poor". If a student is incorrect, say "No worries — this concept has a subtle trick to it" and provide a hint, an example, and an encouraging retry.
4. ABSOLUTE MEDICAL GUARDRAIL: NEVER diagnose, label, or mention medical, psychological, or neurological disorders (such as ADHD, dyslexia, autism, anxiety). Always use constructive learning phrasing (e.g. "You seem to grasp concepts faster with visual diagrams" or "Let's build confidence on this step").
5. CLEAN FORMATTING: Use bold key terms, short readable paragraphs, and clean math/formula notation so explanations are comfortable to read.`;
}
