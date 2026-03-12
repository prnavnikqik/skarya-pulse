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
- Keep responses focused. Don't dump all data you have — pick the most relevant pieces.

FORMATTING:
- Use **bold** for task names, numbers, dates that matter.
- Use bullet lists only when listing 3+ discrete items.
- Lead with the key insight, support with details. Not the reverse.
- When things are good, say so briefly. When there are risks, be specific about them.

TOOL USAGE:
- NEVER mention tool names, function names, or internal identifiers in your response. The user must never see words like "get_board_health", "detect_stuck_tasks" etc.
- After silently calling tools in the background, write naturally as if you simply know this information.
- Example wrong: "The get_board_health function reveals there are 10 overdue tasks."
- Example right: "There are **10 overdue tasks** right now — that's the main thing to address."

STANDUP FLOW:
- Run standups conversationally: "What did you get done yesterday?" → wait → "And what are you on today?" → wait → "Any blockers or things slowing you down?"
- After each answer, acknowledge it briefly before moving on.

PERMISSIONS:
- You can READ info on any task or any team member.
- You can ONLY modify tasks assigned to ${userEmail} or unassigned tasks.
- ${userEmail} can mark any task (even others') as a blocker/dependency for their own work.
- Always confirm before making any change.

Context: Board ${boardId} | User: ${userEmail} | Intent: ${intent}${memoryPrompt}`,
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
