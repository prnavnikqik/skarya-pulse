import { generateObject } from 'ai';
import { z } from 'zod';

export type UserIntent =
    | 'standup_update'
    | 'task_query'
    | 'search_tasks'
    | 'board_analytics'
    | 'document_request'
    | 'task_management'
    | 'general_chat';

export interface IntentAnalysis {
    intent: UserIntent;
    confidence: number;
    searchQuery?: string;
}

export async function analyzeIntent(model: any, messages: any[], userMessage: string): Promise<IntentAnalysis> {
    try {
        // Take last few messages for context
        const context = messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');

        const { object } = await generateObject({
            model: model,
            schema: z.object({
                intent: z.enum([
                    'standup_update',
                    'task_query',
                    'search_tasks',
                    'board_analytics',
                    'document_request',
                    'task_management',
                    'general_chat'
                ]),
                confidence: z.number(),
                searchQuery: z.string().optional()
            }),
            prompt: `Categorize the project management interaction.
            
            Conversation Context:
            ${context}
            
            Current User Message: "${userMessage}"
            
            - standup_update: Starting or continuing a daily sync (even short answers like 'I did X' or 'No blockers').
            - task_query: Questions about tasks or status.
            - board_analytics: Health/Metrics/Risks.
            - task_management: Editing tasks (priority, reassign).
            - document_request: Drafts/PRDs/Digests.
            - general_chat: Greetings, off-topic.`
        });

        return {
            intent: object.intent as UserIntent,
            confidence: object.confidence,
            searchQuery: object.searchQuery
        };
    } catch (error) {
        return { intent: 'general_chat', confidence: 0 };
    }
}
