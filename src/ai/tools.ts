import { tool } from 'ai';
import { z } from 'zod';
import { TaskReader } from '@/integrations/task-reader';
import Standup from '@/models/Standup';
import connectToDatabase from '@/lib/mongoose';

export function getAgentTools(boardId: string, workspaceId: string, userEmail: string) {
    return {
        get_active_tasks: tool({
            description: 'Fetch a short, lightweight list of active tasks for the current user. Use this first to understand what they are currently working on.',
            parameters: z.object({
                limit: z.number().optional().describe('Maximum number of tasks to return (default 5)')
            }),
            execute: async ({ limit }) => {
                try {
                    const tasks = await TaskReader.getActiveTasks(boardId, workspaceId, userEmail, limit || 5);
                    return { success: true, tasks };
                } catch (err: any) {
                    return { success: false, error: err.message };
                }
            }
        }),

        search_tasks: tool({
            description: 'Search for tasks related to a specific keyword or topic, even if not actively assigned to the user today.',
            parameters: z.object({
                query: z.string().describe('The search keyword or topic to look for (e.g. "auth" or "login")')
            }),
            execute: async ({ query }) => {
                try {
                    const tasks = await TaskReader.searchUserTasks(boardId, workspaceId, userEmail, query);
                    return { success: true, tasks };
                } catch (err: any) {
                    return { success: false, error: err.message };
                }
            }
        }),

        get_task_details: tool({
            description: 'Fetch in-depth details about a single specific task, including subtasks, description, and status.',
            parameters: z.object({
                taskId: z.string().describe('The ID of the task to inspect')
            }),
            execute: async ({ taskId }) => {
                try {
                    const details = await TaskReader.getTaskDetails(boardId, workspaceId, taskId);
                    return { success: true, details };
                } catch (err: any) {
                    return { success: false, error: err.message };
                }
            }
        }),

        persist_standup: tool({
            description: 'Once you have gathered the users standup data (what they did yesterday, what they are doing today, and any blockers), call this tool to persist it permanently in the database.',
            parameters: z.object({
                yesterday: z.string().describe('What the user accomplished yesterday.'),
                today: z.string().describe('What the user intends to work on today.'),
                blockers: z.string().describe('Any blockers or issues preventing progress.')
            }),
            execute: async (args) => {
                try {
                    await connectToDatabase();
                    await Standup.create({
                        userEmail: userEmail,
                        workspaceId: workspaceId,
                        boardId: boardId,
                        yesterday: args.yesterday,
                        today: args.today,
                        blockers: args.blockers
                    });
                    return { success: true, message: 'Standup successfully recorded in the MongoDB database.' };
                } catch (error: Error | unknown) {
                    return { success: false, error: error instanceof Error ? error.message : String(error) };
                }
            }
        })
    };
}
