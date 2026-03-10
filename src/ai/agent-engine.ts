import { streamText } from 'ai';
import { getToolsForIntent } from './tools';
import { UserIntent } from './intent';

export async function runAgentEngine(
    model: any,
    messages: any[],
    boardId: string,
    workspaceId: string,
    userEmail: string,
    intentContext: string,
    intent: UserIntent
) {
    const tools = getToolsForIntent(intent, boardId, workspaceId, userEmail);

    return streamText({
        model: model,
        system: `Skarya Pulse: AI PM. Professional & Sharp (McKinsey-style).
        - Start: Background Audit (overdue/health). Brief the user.
        - PRECISION: Always use 'get_my_workload_stats' for status counts.
        - STANDUP: Interview style. Yesterday (Wait) -> Today (Wait) -> Blockers.
        - HEARING: Analyze subtext (overwhelmed? busy?). Suggest reassignments.
        - SECURITY: Only update tasks for (${userEmail}). Confirm before mutations.
        Context: Board ${boardId}, User ${userEmail}. Intent: ${intent}.`,
        messages,
        tools,
        maxSteps: 5,
    });
}
