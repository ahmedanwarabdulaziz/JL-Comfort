import { supabase } from '@/lib/supabase/client';
import { AIChatLogRow } from '@/lib/types/ai';

const rowToAIChatLog = (row: any): AIChatLogRow => ({
  id: row.id,
  sessionId: row.session_id,
  mode: row.mode,
  userMessage: row.user_message,
  assistantMessage: row.assistant_message,
  filters: row.filters || {},
  productCount: row.product_count ?? 0,
  createdAt: new Date(row.created_at),
});

const LOG_PAGE_SIZE = 200;

/** Most recent conversations first — admin-only via RLS (see 20260817130000_ai_chat_logs.sql). */
export const getAIChatLogs = async (): Promise<AIChatLogRow[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('ai_chat_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(LOG_PAGE_SIZE);

  if (error) {
    console.error('Error fetching AI chat logs:', error);
    return [];
  }
  return (data || []).map(rowToAIChatLog);
};

/** Deletes every logged conversation. Used by the admin "Clear All Logs" action. */
export const clearAIChatLogs = async (): Promise<void> => {
  if (!supabase) return;

  // Supabase requires a filter on delete; this matches every row without narrowing anything.
  const { error } = await supabase.from('ai_chat_logs').delete().not('id', 'is', null);
  if (error) {
    console.error('Error clearing AI chat logs:', error);
    throw error;
  }
};
