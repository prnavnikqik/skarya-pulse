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
- For task mutations (create, update, comment, subtask), ALWAYS wait for user confirmation via the UI card.
- When suggesting subtasks, use "auto_generate_subtasks" first to get context, then offer to create them.
- If a user mentions a blocker, proactively offer to flag it on the relevant task using "add_task_comment".

STANDUP FLOW (The "Pulse" Standard):
1. **Contextual Start**: Briefly check 'get_past_standups'. Reference what they were doing if possible.
2. **Phase 1 (Yesterday & Progress)**: Don't just ask "what did you do?". Instead, use 'get_active_tasks' and **walk through their assigned tasks one by one**. Ask: "How did we net out on **[Task Name]**? Is it still in progress or can we move it to Done?"
3. **Phase 2 (Today)**: "Based on your updates, what's the priority for today?" Suggest tasks from the 'Backlog' or 'To Do' if they have capacity.
4. **Phase 3 (Blockers)**: "Any roadblocks or things I can help clear? I can flag blockers or loop in the lead if needed."
5. **Accountability**: You are a **mediator**, not just a note-taker. If a task is lagging, ask *why* and if a subtask or priority change is needed.
6. **Confirmation**: Once the session is wraped, use 'persist_standup' to save the record permanently.

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
