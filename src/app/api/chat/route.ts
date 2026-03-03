// 
export const dynamic = 'force-dynamic';
import { groq } from '@ai-sdk/groq';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { TaskReader } from '@/integrations/task-reader';
import { skaryaClient } from '@/integrations/skarya-client';
import { TaskWriter } from '@/integrations/task-writer';

export const maxDuration = 30;

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: Request) {
  const { messages, workspaceId, boardId, userEmail, modelId } = await req.json();

  if (!workspaceId || !boardId || !userEmail) {
    return new Response('Missing required context (workspaceId, boardId, userEmail)', { status: 400 });
  }

  let selectedModel;
  if (modelId && modelId.startsWith('claude')) {
    selectedModel = anthropic(modelId);
  } else {
    selectedModel = groq(modelId || 'llama-3.3-70b-versatile');
  }

  const result = streamText({
    model: selectedModel,
    system: `You are Skarya Brain, an omniscient AI project manager embedded inside the Skarya suite (currently testing against staging domain skaryaa.ai).
Your primary mission is to REPLACE the daily standup meeting and enforce developer accountability.

When interacting with a user:
1. ALWAYS use the 'get_user_tasks' tool first if you do not know their current active tasks.
2. Formally ask them the standup questions: What did they accomplish yesterday? What are they working on today? Any blockers?
3. HOLD THEM ACCOUNTABLE. Compare what they say with the data from 'get_user_tasks'. 
   - If they claim they finished a task but it's not marked Done, offer to update it using 'update_task_status'.
   - If they are working on something not assigned to them, offer to create it using 'create_task'.
4. Be professional, concise, and proactive. The goal is to keep the Skarya boards purely up to date without a human project manager.`,
    messages,
    tools: {
      get_user_tasks: tool({
        description: 'Fetch all tasks assigned to the current user in the active board. Call this whenever the user asks about their own tasks, what they should do today, or asks for a summary of their work.',
        parameters: z.object({}),
        // @ts-ignore
        execute: async (_args) => {
          try {
            const tasks = await TaskReader.fetchUserTasks(boardId, workspaceId, userEmail);
            return {
              success: true,
              message: `Found ${tasks.length} tasks.`,
              tasks: tasks.map(t => ({
                id: String(t._id),
                taskNumber: String(t.taskNumber),
                name: String(t.name),
                status: String(t.status),
                percentageCompletion: Number(t.percentageCompletion),
                subtasks: t.subtasks?.map(s => (`${s.subtaskNumber}: ${s.name} (${s.status})`)) || []
              }))
            };
          } catch (error: Error | unknown) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
          }
        },
      } as any),

      create_task: tool({
        description: 'Create a new task on the board. Use this when the user explicitly asks to create a task.',
        parameters: z.object({
          name: z.string().describe('The name or title of the task'),
          priority: z.enum(['Low', 'Medium', 'High', 'Critical']).describe('The priority of the task. Default to Medium if not specified.'),
          status: z.literal('To Do').describe('Always To Do'),
          assigneeEmail: z.string().describe('The email of the assigned user. Defaults to the current user if not specified.')
        }),
        // Notice we do NOT implement 'execute' here!
        // By omitting 'execute', we force the tool call to be returned to the client.
        // The client will display a Confirmation Card, and then supply the tool result once confirmed.
      } as any),

      update_task_status: tool({
        description: 'Update the status or completion percentage of an existing task.',
        parameters: z.object({
          taskId: z.string().describe('The internal _id of the task to update'),
          taskNumber: z.string().describe('The human-readable task number e.g., BT0027'),
          status: z.string().describe('The new status (e.g., In Progress, Done, Backlog)'),
          statusCategory: z.enum(['not_started', 'in_progress', 'completed']).describe('The general category for the status'),
          percentageCompletion: z.number().describe('0 to 100 percentage. Set to 100 if completed, 50 if halfway, etc.')
        }),
        // Omit execute to ask for confirmation from the client
      } as any),

      add_task_comment: tool({
        description: 'Add a comment to an existing task.',
        parameters: z.object({
          taskId: z.string().describe('The internal _id of the task'),
          taskNumber: z.string().describe('The human-readable task number e.g., BT0027'),
          comment: z.string().describe('The text to post as a comment')
        }),
        // Omit execute to ask for confirmation
      } as any),

      get_board_info: tool({
        description: 'Fetch the board\'s basic information, including the board name, available statuses, and priorities. Use this if the user asks for info about the board or workspace.',
        parameters: z.object({}),
        // @ts-ignore
        execute: async (_args) => {
          try {
            return {
              success: true,
              message: `Retrieved mock board info for staging workspace.`,
              info: {
                boardName: "Main Standup Board",
                statuses: ["To Do", "In Progress", "Review", "Done", "Blocked", "Backlog"],
                priorities: ["Low", "Medium", "High", "Critical"]
              }
            };
          } catch (error: Error | unknown) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
          }
        }
      } as any),

      analyze_board_health: tool({
        description: 'Read the current tasks and analyze the overall health of the project board. Identify bottlenecks, stuck tasks (e.g., Blocked status, untouched tasks), or overdue items. Call this ONLY when the user explicitly asks for a board analysis or executive summary.',
        parameters: z.object({}),
        // @ts-ignore
        execute: async (_args) => {
          try {
            const tasks = await TaskReader.fetchUserTasks(boardId, workspaceId, userEmail);

            // Simple logic: filter out done tasks and find anything Blocked
            const activeTasks = tasks.filter(t => t.status !== 'Done' && t.statusCategory !== 'completed');
            const blockedTasks = tasks.filter(t => String(t.status).toLowerCase().includes('block'));

            return {
              success: true,
              message: `Board Health Analysis complete.`,
              metrics: {
                totalActiveTasks: activeTasks.length,
                totalBlockedTasks: blockedTasks.length,
                stuckTasks: blockedTasks.map(t => ({ id: t.taskNumber, name: t.name, status: t.status })),
                recommendation: blockedTasks.length > 0
                  ? "Recommend immediate intervention on blocked tasks."
                  : "Board is relatively healthy with no blocked tasks detected."
              }
            };
          } catch (error: Error | unknown) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
          }
        }
      } as any),

      create_subtask: tool({
        description: 'Create a new subtask under an existing parent task. Use this when the user asks to break down a larger task into smaller chunks.',
        parameters: z.object({
          parentTaskId: z.string().describe('The internal _id of the parent task'),
          name: z.string().describe('The name or title of the subtask'),
          assigneeEmail: z.string().describe('The email of the assigned user. Defaults to the current user.')
        }),
        // Omit execute to ask for confirmation from the client
      } as any),

      generate_status_report: tool({
        description: 'Generate a comprehensive daily or weekly status report based on the user\'s active and completed tasks.',
        parameters: z.object({
          timeframe: z.enum(['daily', 'weekly']).describe('The timeframe for the report')
        }),
        // @ts-ignore
        execute: async (args) => {
          try {
            const tasks = await TaskReader.fetchUserTasks(boardId, workspaceId, userEmail);

            const completed = tasks.filter(t => t.statusCategory === 'completed' || t.status === 'Done');
            const inProgress = tasks.filter(t => t.statusCategory === 'in_progress' || t.status === 'In Progress');
            const todo = tasks.filter(t => t.statusCategory === 'not_started' || ['To Do', 'Backlog'].includes(t.status));

            return {
              success: true,
              message: `Status report compiled for timeframe: ${args.timeframe}`,
              reportData: {
                summary: `You have completed ${completed.length} tasks and are actively working on ${inProgress.length} tasks.`,
                completedItems: completed.map(t => t.name),
                inProgressItems: inProgress.map(t => t.name),
                upcomingItems: todo.map(t => t.name).slice(0, 5) // Just top 5
              }
            };
          } catch (error: Error | unknown) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
          }
        }
      } as any)
    },
    maxSteps: 3, // Allow the AI to call a tool, get the result, and then respond to the user
  } as any);

  return result.toTextStreamResponse();
}
