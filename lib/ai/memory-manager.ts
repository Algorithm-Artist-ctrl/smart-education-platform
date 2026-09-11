// lib/ai/memory-manager.ts
// Manages long-term structured learning memory, preferences, and safe memory resets

import { SupabaseClient } from '@supabase/supabase-js';

export interface StoredLearningMemory {
  common_mistakes?: string[];
  memorized_facts?: string[];
  focus_topics?: string[];
  learning_habits?: string[];
  preferred_topics?: string[];
  [key: string]: any;
}

export interface InteractionPreferences {
  hint_first?: boolean;
  show_examples?: boolean;
  challenge_mode?: boolean;
  auto_practice?: boolean;
  [key: string]: any;
}

/**
 * Heuristically extracts declared learning preferences and study patterns from chat turns.
 */
export function extractLearningPatterns(
  userText: string
): {
  newPreferences: Partial<InteractionPreferences>;
  newHabit?: string;
  detectedMistake?: string;
} {
  const lower = userText.toLowerCase();
  const newPreferences: Partial<InteractionPreferences> = {};
  let newHabit: string | undefined;
  let detectedMistake: string | undefined;

  // 1. Hint before answer preferences
  if (
    lower.includes('hint first') ||
    lower.includes('give me a hint') ||
    lower.includes("don't tell me the answer") ||
    lower.includes("pehle hint do") ||
    lower.includes("direct answer mat do")
  ) {
    newPreferences.hint_first = true;
    newHabit = 'Prefers scaffolded hints before seeing the final solution';
  }

  // 2. Real-world example preferences
  if (
    lower.includes('with examples') ||
    lower.includes('give examples') ||
    lower.includes('real world example') ||
    lower.includes('example se samjhao') ||
    lower.includes('example do')
  ) {
    newPreferences.show_examples = true;
    newHabit = 'Grasps concepts fastest with real-world analogies and examples';
  }

  // 3. Visual explanation preference
  if (
    lower.includes('visually') ||
    lower.includes('visual explanation') ||
    lower.includes('diagram') ||
    lower.includes('draw')
  ) {
    newHabit = 'Learns effectively through visual representations and diagrams';
  }

  // 4. Repeated difficulty / mistake signals
  if (
    lower.includes('factorization me problem') ||
    lower.includes('struggling with factorization') ||
    lower.includes('factorization nahi samajh')
  ) {
    detectedMistake = 'Factorization method in quadratic equations';
  } else if (
    lower.includes('sign mistake') ||
    lower.includes('plus minus me galti') ||
    lower.includes('negative sign')
  ) {
    detectedMistake = 'Sign convention / negative symbol errors in algebra';
  }

  return { newPreferences, newHabit, detectedMistake };
}

/**
 * Asynchronously updates the student's AI profile memory in Supabase.
 */
export async function updateAIMemoryFromConversation(
  supabase: SupabaseClient,
  studentId: string,
  userText: string,
  currentMemory?: StoredLearningMemory,
  currentPrefs?: InteractionPreferences
): Promise<void> {
  try {
    const { newPreferences, newHabit, detectedMistake } = extractLearningPatterns(userText);

    if (Object.keys(newPreferences).length === 0 && !newHabit && !detectedMistake) {
      return; // No new pattern identified in this turn
    }

    const updatedPrefs: InteractionPreferences = {
      ...(currentPrefs || {}),
      ...newPreferences,
    };

    const learningHabits = [...(currentMemory?.learning_habits || [])];
    const commonMistakes = [...(currentMemory?.common_mistakes || [])];

    if (newHabit && !learningHabits.includes(newHabit)) {
      learningHabits.unshift(newHabit);
    }

    if (detectedMistake && !commonMistakes.includes(detectedMistake)) {
      commonMistakes.unshift(detectedMistake);
    }

    const memory: StoredLearningMemory = {
      common_mistakes: commonMistakes.slice(0, 6),
      memorized_facts: currentMemory?.memorized_facts || [],
      focus_topics: currentMemory?.focus_topics || [],
      learning_habits: learningHabits.slice(0, 6),
    };

    await supabase
      .from('student_ai_profiles')
      .upsert(
        {
          student_id: studentId,
          interaction_preferences: updatedPrefs,
          learning_memory: memory,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id' }
      );
  } catch (err) {
    console.warn('[Memory Manager] Asynchronous memory update skipped:', err);
  }
}

/**
 * Safely resets only AI personalization memories and interaction tags.
 * GUARANTEE: Never touches academic records, quiz attempts, or topic mastery grades.
 */
export async function resetAILearningMemory(
  supabase: SupabaseClient,
  studentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const defaultMemory: StoredLearningMemory = {
      common_mistakes: [],
      memorized_facts: [],
      focus_topics: [],
      learning_habits: [],
    };

    const defaultPrefs: InteractionPreferences = {
      hint_first: true,
      show_examples: true,
      challenge_mode: false,
      auto_practice: true,
    };

    const { error } = await supabase
      .from('student_ai_profiles')
      .update({
        learning_memory: defaultMemory,
        interaction_preferences: defaultPrefs,
        conversation_style: 'friendly',
        explanation_style: 'examples',
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', studentId);

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'AI partner learning preferences reset successfully. Academic progress remains intact.',
    };
  } catch (err: any) {
    console.error('[Memory Manager] Reset error:', err);
    return {
      success: false,
      message: err?.message || 'Failed to reset learning preferences.',
    };
  }
}
