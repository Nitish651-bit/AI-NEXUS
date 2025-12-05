import { supabase } from '@/integrations/supabase/client';

interface LogToolUsageParams {
  toolName: string;
  toolCategory: string;
  inputText?: string;
  outputText?: string;
  prompt?: string;
  error?: string;
}

export async function logToolUsage(params: LogToolUsageParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user, skipping tool usage logging');
      return;
    }

    // Log to user_activity table (comprehensive log)
    const { error: activityError } = await supabase
      .from('user_activity')
      .insert({
        user_id: user.id,
        tool_name: params.toolName,
        tool_category: params.toolCategory,
        input_text: params.inputText || params.prompt || null,
        output_text: params.outputText || params.error || null,
      });

    if (activityError) {
      console.error('Failed to log user activity:', activityError);
    }

    // Also log to ai_tool_usage for quick stats
    const { error: usageError } = await supabase
      .from('ai_tool_usage')
      .insert({
        user_id: user.id,
        tool_name: params.toolName,
        tool_category: params.toolCategory,
        prompt: params.prompt || params.inputText || null,
      });

    if (usageError) {
      console.error('Failed to log AI tool usage:', usageError);
    }

    console.log('Tool usage logged successfully:', params.toolName);
  } catch (error) {
    console.error('Error logging tool usage:', error);
  }
}

export function useToolUsageLogger() {
  return { logToolUsage };
}
