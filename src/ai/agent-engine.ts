import { streamText } from 'ai';
import { getToolsForIntent } from './tools';
import { UserIntent } from './intent';
import ChatSession from '@/models/ChatSession';

export async function runAgentEngine(
    model: any,
    messages: any[],
    boardId: string,
    workspaceId: string,
    userEmail: string,
    intentContext: string,
    intent: UserIntent,
    chatId?: string,
    rawMessages?: any[],
    chatType?: string
) {
    const tools = getToolsForIntent(intent, boardId, workspaceId, userEmail);

    // Fetch Long-Term Memory (Last 2 sessions)
    let memoryPrompt = '';
    try {
        const pastSessions = await ChatSession.find({ userEmail, workspaceId })
            .sort({ createdAt: -1 })
            .limit(2)
            .lean();

        if (pastSessions.length > 0) {
            memoryPrompt = '\n\nLONG-TERM MEMORY (Prior conversations context):\n';
            // @ts-ignore
            pastSessions.forEach((session, i) => {
                memoryPrompt += `- Session ${i + 1} (${new Date(session.createdAt).toLocaleDateString()}): ${session.title}\n`;
            });
            memoryPrompt += `\nUse this context if the user refers to past discussions or asks "what were we talking about?".`;
        }
    } catch (e) {
        console.error("Failed to load memory context", e);
    }

    return streamText({
        model: model,
        system: `Skarya Pulse: AI PM. Professional & Sharp (McKinsey-style).
        - Start: Background Audit (overdue/health). Brief the user.
        - PRECISION: Always use 'get_my_workload_stats' for status counts.
        - STANDUP: Interview style. Yesterday (Wait) -> Today (Wait) -> Blockers.
        - HEARING: Analyze subtext (overwhelmed? busy?). Suggest reassignments.
        - SECURITY/PERMISSIONS: You can READ the status and info of ANY task and ANY user. However, you can ONLY update or modify tasks that are either explicitly assigned to (${userEmail}) OR are unassigned.
        - ROADBLOCKS: The user (${userEmail}) can mark ANY task (even someone else's) as a roadblock for their own tasks. Let them do this easily. Confirm before mutations.
        Context: Board ${boardId}, User ${userEmail}. Intent: ${intent}.${memoryPrompt}`,
        messages,
        tools,
        maxSteps: 5,
        onFinish: async (event: any) => {
            if (!chatId || !rawMessages) return;
            try {
                // Construct the final messages array matching AI SDK state
                const title = rawMessages?.length > 0 && rawMessages[0].content
                    ? (rawMessages[0].content as string).substring(0, 50) + '...'
                    : 'New Conversation';

                await ChatSession.findOneAndUpdate(
                    { chatId },
                    {
                        $set: {
                            userEmail,
                            workspaceId,
                            boardId,
                            title,
                            type: chatType || 'chat',
                            messages: [...rawMessages, ...event.response.messages],
                            updatedAt: new Date()
                        }
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            } catch (e) {
                console.error("Failed to save chat history to DB within onFinish:", e);
            }
        }
    });
}
