import Groq from 'groq-sdk';
import { StandupOutput } from '@/types';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'dummy_key',
});

export const LLM_MODEL = process.env.GROQ_MODEL || 'llama3-70b-8192';

export class LLMClient {
    /**
     * Generates a conversational response (e.g., asking the next standup question)
     */
    static async generateConversationReply(
        systemPrompt: string,
        history: { role: 'user' | 'assistant'; content: string }[],
        userMessage?: string
    ): Promise<string> {
        const messages: any[] = [{ role: 'system', content: systemPrompt }, ...history];
        if (userMessage) {
            messages.push({ role: 'user', content: userMessage });
        }

        const completion = await groq.chat.completions.create({
            messages,
            model: LLM_MODEL,
            temperature: 0.7,
            max_tokens: 1500,
        });

        return completion.choices[0]?.message?.content || '';
    }

    /**
     * Generates the structured output extraction
     */
    static async extractStructuredData(
        extractionPrompt: string,
        history: { role: 'user' | 'assistant'; content: string }[]
    ): Promise<StandupOutput | null> {
        const historyText = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
        const prompt = `${extractionPrompt}\n\n## Conversation:\n${historyText}`;

        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: LLM_MODEL,
                temperature: 0,
                response_format: { type: 'json_object' },
                max_tokens: 2000,
            });

            const rawContent = completion.choices[0]?.message?.content;
            if (!rawContent) return null;

            // Ensure it's valid JSON
            const parsed = JSON.parse(rawContent);
            return parsed as StandupOutput;
        } catch (e) {
            console.error('[LLM Extraction Error]', e);
            return null;
        }
    }
}
