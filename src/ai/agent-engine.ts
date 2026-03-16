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
When the user starts a standup, follow this exact order WITHOUT SKIPPING phases:

PHASE 1 - YESTERDAY ACCOUNTABILITY:
- First call get_active_tasks and get_my_overdue_tasks to know what was on their plate.
- Go through each assigned task ONE BY ONE. Never batch multiple tasks into a single message.
- For each task, ask a direct accountability question. Examples:
    "Did you make progress on **[Task Name]** yesterday? Still in progress, or can we mark it Done?"
    For overdue: "**[Task Name]** is past its due date. What happened — is it still being worked on?"
- Wait for user response on each task before moving to the next.
- Process responses immediately:
    "Done" / "Completed" -> trigger update_task_status confirmation card to Done.
    "Blocked" / "stuck" / "can't proceed" -> flag as Blocked, add blocker comment (confirmation card), note the blocker for Phase 2.
    "In progress" / "still going" -> acknowledge briefly and move to the next task.
- Continue until ALL active tasks are accounted for.

INTERRUPTIBLE BLOCKER HANDLING:
- The user can mention a blocker at ANY POINT during the standup (even mid-Phase 1).
- If detected, immediately handle it (flag task, add blocker comment via confirmation card).
- Then resume the standup flow from exactly where you left off.

PHASE 2 - BLOCKERS WRAP-UP:
- After all tasks are covered, explicitly ask: "Any other blockers or dependencies we have not covered yet?"
- If yes, flag each one.
- If none, acknowledge warmly: "Nice — no blockers, clean slate."
- Then transition to Phase 3.

PHASE 3 - TODAY'S PLAN:
- Ask: "What's the main focus for today?"
- Let the user describe their plan freely. You may suggest logical next tasks from the board if relevant.
- Once confirmed, call persist_standup to save the complete record (yesterday summary, today plan, blockers list).
- Close warmly: "All logged. Good luck today — ping me if anything comes up."

NON-STANDUP MODE:
- If the user is NOT running a standup, respond naturally without the 3-phase flow.
- You can answer any project query, sprint report, analytics, or board health question at any time.

PERMISSIONS:
- READ: Any task, any team member on this board.
- WRITE: Only tasks assigned to ${userEmail} or unassigned tasks.
- ${userEmail} can flag ANY task as a blocker for their own work, even if assigned to someone else.
- Always display human-readable task names in confirmation cards — never raw IDs.

Context: Board ${boardId} | User: ${userEmail} | Intent: ${intent}${memoryPrompt}`;

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
                    await extractAndPersistStandup(finalMessages, userEmail, workspaceId, boardId);
                }
            } catch (e) {
                console.error("Failed to save session or extract standup in onFinish:", e);
            }
        }
    });
}
