import connectToDatabase from '@/lib/mongoose';
import { StandupSession } from '@/models/StandupSession';
import { TaskReader } from '@/integrations/task-reader';
import { LLMClient } from '@/llm/client';
import { buildTaskContext, buildTaskReferenceJson } from '@/llm/prompts/context-builder';
import { getSystemPromptWithContext } from '@/llm/prompts/system';
import { EXTRACTION_PROMPT } from '@/llm/prompts/output-extractor';
import { StandupOutputSchema } from '@/llm/schemas/standup-output';
import { ConversationMessage, StandupSession as IStandupSession, StandupOutput } from '@/types';

export class SessionManager {
    /**
     * Initializes a new standup session.
     * 1. Fetches tasks for user
     * 2. Calls LLM for the first greeting/question
     * 3. Saves new session state in DB
     */
    static async startSession(
        workspaceId: string,
        boardId: string,
        userEmail: string,
        userName: string
    ): Promise<{ sessionId: string; firstMessage: string; taskCount: number }> {
        await connectToDatabase();

        // 1. Fetch tasks
        const tasks = await TaskReader.fetchUserTasks(boardId, workspaceId, userEmail);

        // 2. Build context and call LLM
        const contextStr = buildTaskContext(tasks);
        const systemPrompt = getSystemPromptWithContext(contextStr);

        const firstMessageContent = await LLMClient.generateConversationReply(
            systemPrompt,
            [] // Empty history for first turn
        );

        const initialHistory: ConversationMessage[] = [
            { role: 'assistant', content: firstMessageContent, timestamp: new Date().toISOString() }
        ];

        // 3. Save to DB
        const session = new StandupSession({
            userId: userEmail,
            userName,
            workspaceId,
            boardId,
            standupDate: new Date().toISOString().split('T')[0],
            status: 'in_progress',
            conversationHistory: initialHistory,
            taskContextSnapshot: tasks
        });

        await session.save();

        return {
            sessionId: session.id, // Mongoose virtual
            firstMessage: firstMessageContent,
            taskCount: tasks.length
        };
    }

    /**
     * Retrieves an active session by ID.
     */
    static async getSession(sessionId: string): Promise<IStandupSession | null> {
        await connectToDatabase();
        const session = await StandupSession.findById(sessionId);
        return session ? session.toJSON() : null;
    }

    /**
     * Appends user message and gets LLM reply.
     */
    static async processUserMessage(
        sessionId: string,
        userMessage: string
    ): Promise<{ message: string; isComplete: boolean; llmOutput?: StandupOutput }> {
        await connectToDatabase();
        const sessionDoc = await StandupSession.findById(sessionId);

        if (!sessionDoc) {
            throw new Error('Session not found');
        }

        // Append user message
        const userTurn: ConversationMessage = {
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString()
        };
        sessionDoc.conversationHistory.push(userTurn);

        // Call LLM
        const contextStr = buildTaskContext(sessionDoc.taskContextSnapshot as any);
        const systemPrompt = getSystemPromptWithContext(contextStr);

        // Pass previous history for context (excluding the new user turn just added to array, we pass it explicitly)
        const historyForLlm = sessionDoc.conversationHistory.slice(0, -1).map((msg: any) => ({
            role: msg.role,
            content: msg.content
        }));

        const assistantReply = await LLMClient.generateConversationReply(
            systemPrompt,
            historyForLlm,
            userMessage
        );

        // Check completion signal
        const isComplete = assistantReply.includes('Great, that covers everything');

        // Append assistant's reply
        sessionDoc.conversationHistory.push({
            role: 'assistant',
            content: assistantReply,
            timestamp: new Date().toISOString()
        });

        if (isComplete) {
            sessionDoc.status = 'completed';
            sessionDoc.completedAt = new Date().toISOString();

            // TRIGGER LLM EXTRACTION
            const taskRefJson = buildTaskReferenceJson(sessionDoc.taskContextSnapshot as any);
            const fullExtractionPrompt = `${EXTRACTION_PROMPT}\n\n## References\n${taskRefJson}`;

            const extractedData = await LLMClient.extractStructuredData(
                fullExtractionPrompt,
                sessionDoc.conversationHistory as any
            );

            if (extractedData) {
                // Validate with Zod
                const parsed = StandupOutputSchema.safeParse(extractedData);
                if (parsed.success) {
                    sessionDoc.llmOutput = parsed.data as any;
                } else {
                    console.error('[Extraction Validation Error]', parsed.error);
                    sessionDoc.llmOutput = extractedData as any; // Save it anyway for debugging in prototype
                }
            }
        }

        await sessionDoc.save();

        return {
            message: assistantReply,
            isComplete,
            llmOutput: sessionDoc.llmOutput
        };
    }
}
