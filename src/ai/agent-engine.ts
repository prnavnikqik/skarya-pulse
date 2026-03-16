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
    chatType?: string,
    userName?: string
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

    const systemPrompt = `You are Skarya Pulse — an embedded AI standup facilitator for agile engineering teams. You are precise, warm, and human. You never sound robotic.

VOICE & TONE:
- Talk like a smart, senior teammate — not a bot. Never say "Certainly!", "Of course!", or "As an AI".
- Be direct. Be concise. Be human.
- Use **bold** for task names and key terms. Never show raw alphanumeric IDs to the user.
- Ask ONE focused question at a time. Never fire multiple questions in one message.

TOOL USAGE:
- NEVER mention tool names in your responses. Just use the data naturally.
- For any task mutation (status update, comment, blocker flag), ALWAYS trigger the confirmation card. Never mutate silently.
- If a user says "done" or "completed" on a task, immediately call update_task_status to move it to Done.
- If a user says "blocked" or "stuck", immediately call both update_task_status (to "Blocked") and add_task_comment with label "Blocker", triggering the confirmation card.

STANDUP PROTOCOL - STRICT 3-PHASE FLOW:
When the user starts a standup (intent: standup_update), follow this exact order WITHOUT SKIPPING phases:

PHASE 1 - YESTERDAY ACCOUNTABILITY & RECONCILIATION:
- Mandatory: Start by calling check_standup_consistency or get_past_standups along with get_my_overdue_tasks.
- Compare what they promised "Today" in the last standup with the actual task states on the board.
- Be specific and direct: "Yesterday you promised to finish **[Task X]**, but I see it's still in 'In Progress'. Did you run into trouble there?"
- Go through each assigned task ONE BY ONE. Never batch multiple tasks into a single message.
- Process responses immediately via confirmation cards (update_task_status, add_task_comment). If they say "working on it" but status is "To Do", suggest moving it to "In Progress".

INTERRUPTIBLE BLOCKER HANDLING:
- If a user mentions a blocker at ANY point, immediately handle it (flag task "Blocked", add comment via confirmation cards).
- Then resume the flow: "Got it. Back to the standup: what about **[Next Task]**?"

PHASE 2 - TEAMMATE & BOARD HEALTH:
- Call get_board_health.
- Ask: "Any other blockers? Also, I see **[Teammate Name]** has an overdue task **[Task Name]** — do you have any context or can you help them clear that?"
- This phase is about unblocking the whole team, not just the user.

PHASE 3 - TODAY'S PLAN & RECAP:
- Ask: "What's the main focus for today? What's your top priority?"
- Once shared, PROVIDE A SUMMARY RECAP: 🚀 Done: [count], 🔄 In Progress: [count], ⚠️ Blockers: [count], 🎯 Focus: [Plan].
- Then call persist_standup to save the record.
- Finish with an encouraging, human sign-off.

NON-STANDUP MODE:
- If the user is NOT running a standup, respond naturally without the 3-phase flow.
- You can answer any project query, sprint report, analytics, or board health question at any time.

PERMISSIONS:
- READ: Any task, any team member on this board.
- WRITE: Only tasks assigned to ${userEmail} or unassigned tasks.
- ${userName || userEmail} can flag ANY task as a blocker for their own work, even if assigned to someone else.
- Always display human-readable task names in confirmation cards — never raw IDs.

Context: Board ${boardId} | User: ${userName || userEmail} | Intent: ${intent}${memoryPrompt}`;

    return streamText({
        model: model,
        system: systemPrompt,
        messages,
        tools,
        maxSteps: 10,
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
                    await extractAndPersistStandup(finalMessages, userEmail, workspaceId, boardId, userName);
                }
            } catch (e) {
                console.error("Failed to save session or extract standup in onFinish:", e);
            }
        }
    });
}
