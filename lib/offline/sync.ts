// lib/offline/sync.ts
import { getQueuedActions, removeQueuedAction, QueuedAction } from './db';
import { createClient } from '@/lib/supabase/client';

export async function flushOfflineQueue(onProgress?: (action: QueuedAction) => void): Promise<{ processed: number; failed: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { processed: 0, failed: 0 };
  }

  const actions = await getQueuedActions();
  if (actions.length === 0) return { processed: 0, failed: 0 };

  const supabase = createClient();
  let processed = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      if (action.type === 'SUBMIT_QUIZ_ANSWER') {
        const { attempt_id, question_id, selected_option_index, is_correct, time_spent_seconds } = action.payload;
        await supabase.from('quiz_attempt_answers').insert({
          attempt_id,
          question_id,
          selected_option_index,
          is_correct,
          time_spent_seconds,
        });
      } else if (action.type === 'COMPLETE_STUDY_TASK') {
        const { id, completed_at } = action.payload;
        await supabase.from('study_plans').update({
          status: 'completed',
          completed_at,
        }).eq('id', id);
      } else if (action.type === 'SUBMIT_ASSIGNMENT') {
        const { assignment_id, student_id, submission_text, file_url } = action.payload;
        await supabase.from('assignment_submissions').upsert({
          assignment_id,
          student_id,
          submission_text,
          file_url,
          submitted_at: new Date().toISOString(),
          status: 'submitted',
        });
      }

      await removeQueuedAction(action.id);
      processed++;
      if (onProgress) onProgress(action);
    } catch (err) {
      console.error('Failed to sync action:', action, err);
      failed++;
    }
  }

  return { processed, failed };
}
