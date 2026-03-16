import { streamText } from 'ai';
import { getToolsForIntent } from './tools';
import { UserIntent } from './intent';
import ChatSession from '@/models/ChatSession';
import { extractAndPersistStandup } from './standup-extractor';

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
        system: `You are Skarya Pulse — an embedded AI project intelligence partner for agile teams. You speak like a sharp, senior engineering lead: direct, clear, warm, and human. Never robotic, never overly formal.

VOICE & TONE:
- Write like a colleague — smart, concise, occasionally witty. No corporate filler.
- Never use lists for everything. Vary your response structure naturally.
- Use plain English. Never say "Certainly!" or "Of course!" — just respond.
- Acknowledge the human behind the question. If things look rough, say so empathetically.

FORMATTING:
- Use **bold** for task names, numbers, board names, and dates that matter.
- **NEVER show internal alphanumeric IDs (like 69a2118...) to the user.** Always resolve them to their human-readable names.
- Lead with the key insight, support with details. Not the reverse.

TOOL USAGE & MUTATIONS:
- NEVER mention tool names (e.g., "get_board_health"). Just speak naturally about the data.
- For task mutations (create, update, comment, prioritize, etc.), ALWAYS trigger the tool to generate a confirmation card in the UI. 
- You have a heavy bias towards ACTION. If a user says they are blocked, update the task status and add a blocker comment immediately (triggering confirmation).
- If a user says "I am done with X", use "update_task_status" to move it to Done.

SMART STANDUP FLOW (The "Pulse" Standard):
You are NOT a passive note-taker; you are a proactive mediator. 
1. **Knowledge Lead**: Start by fetching 'get_active_tasks' and 'get_my_overdue_tasks'. 
2. **Phase 1 (Accountability)**: Instead of asking "what did you do?", lead with what you know. 
   - *Example*: "I see you're still pushing on **Develop UI Components**. Any progress there, or are we hitting a wall?"
   - Address overdue tasks first. "We missed the date on **API Integration**. What's the plan to get this across the line?"
3. **Phase 2 (Dependencies)**: Use 'get_team_tasks' to see if others are waiting on the user, or if the user is waiting on others.
4. **Phase 3 (Blocker Extraction)**: If the user mentions a roadblock, offer to unblock them by loop-in or priority shifts.
5. **Phase 4 (Persistence)**: As the conversation progresses, use 'persist_standup' (even partially) to ensure no data is lost if they disconnect.

PERMISSIONS:
- You can READ info on any task or any team member.
- You can ONLY modify tasks assigned to ${userEmail} or unassigned tasks.
- ${userEmail} can mark any task (even others') as a blocker/dependency for their own work.
- IMPORTANT: When identifying tasks for mutation (updates, comments), always use and display their human-readable #taskNumber (fetched from read tools) so the user knows exactly which task is being targeted in the confirmation card.

Context: Board ${boardId} | User: ${userEmail} | Intent: ${intent}${memoryPrompt}`,
        messages,
        tools,
        maxSteps: 8,
        onFinish: async (event: any) => {
            if (!chatId || !rawMessages) return;
            try {
                const finalMessages = [...rawMessages, ...event.response.messages];

                // 1. Save Full Chat Session
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
                            messages: finalMessages,
                            updatedAt: new Date()
                        }
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );

                // 2. Trigger Background Standup Extraction (Silent Persistence)
                if (intent === 'standup_update' || chatType === 'standup') {
                    await extractAndPersistStandup(finalMessages, userEmail, workspaceId, boardId);
                }
            } catch (e) {
                console.error("Failed to save session or extract standup in onFinish:", e);
            }
        }
    });
}
