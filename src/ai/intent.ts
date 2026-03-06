import { generateObject } from 'ai';
import { z } from 'zod';

export type UserIntent = 'standup_update' | 'task_query' | 'search_tasks' | 'general_chat';

export async function analyzeIntent(
    model: any,
    recentMessages: { role: string; content: string }[],
    userMessage: string
) {
    try {
        const minifiedHistory = recentMessages
            .slice(-3)
            .map(m => `${m.role}: ${m.content}`)
            .join('\n');

        const result = await generateObject({
            model,
            system: `You are an extremely fast classification layer for a project management AI.
Classify the user's latest statement into one of the following intents:
- 'standup_update': User is giving progress on tasks, reporting blockers, or stating what they did yesterday/today.
- 'task_query': User is vaguely asking "what tasks do I have?", "what should I work on?", or "show my assigned work".
- 'search_tasks': User is explicitly searching by a keyword, e.g., "did I do anything related to login?" or "find the bug ticket".
- 'general_chat': Friendly greetings, saying "thanks", or things unrelated to tasks.

If the intent is 'search_tasks', extract a 1-3 word query. Otherwise, query can be empty.
Keep execution under 500ms. Do not overthink.`,
            prompt: `History:\n${minifiedHistory}\n\nUser Message: ${userMessage}`,
            schema: z.object({
                intent: z.enum(['standup_update', 'task_query', 'search_tasks', 'general_chat']).describe('The classified intent of the user message.'),
                searchQuery: z.string().optional().describe('Only if intent is search_tasks, provide the keyword')
            }),
            temperature: 0,
            maxTokens: 50
        });

        return result.object;
    } catch (error) {
        console.error('[IntentAnalyzer Error]', error);
        // Fallback gracefully
        return { intent: 'general_chat' as UserIntent, searchQuery: '' };
    }
}
