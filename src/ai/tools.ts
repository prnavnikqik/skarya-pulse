import { tool } from 'ai';
import { z } from 'zod';
import { TaskReader } from '@/integrations/task-reader';
import { TaskWriter } from '@/integrations/task-writer';
import Standup from '@/models/Standup';
import connectToDatabase from '@/lib/mongoose';
import type { UserIntent } from './intent';

/**
 * Dynamic Tool Selector — Only sends tools relevant to the current intent.
 */
export function getToolsForIntent(
    intent: UserIntent,
    boardId: string,
    workspaceId: string,
    userEmail: string
): Record<string, any> {
    const all: Record<string, any> = getAllAgentTools(boardId, workspaceId, userEmail);

    const toolSets: Record<UserIntent, string[]> = {
        standup_update: ['get_active_tasks', 'get_my_workload_stats', 'get_past_standups', 'update_task_status', 'add_task_comment', 'create_task', 'persist_standup', 'check_standup_consistency', 'get_my_overdue_tasks', 'get_board_health', 'predict_deadline_risk'],
        task_query: ['get_active_tasks', 'get_my_workload_stats', 'get_task_details', 'search_tasks', 'get_task_comments', 'search_all_board_tasks'],
        search_tasks: ['search_tasks', 'search_all_board_tasks', 'get_task_details'],
        board_analytics: ['get_board_health', 'get_team_tasks', 'detect_stuck_tasks', 'predict_deadline_risk', 'get_sprint_summary'],
        document_request: ['get_active_tasks', 'draft_document', 'get_board_health', 'generate_daily_digest', 'get_sprint_summary'],
        task_management: ['update_task_priority', 'set_task_dates', 'assign_task', 'auto_generate_subtasks', 'create_subtask', 'create_task', 'add_task_comment', 'update_task_status'],
        general_chat: ['get_active_tasks'],
    };

    const selectedKeys = toolSets[intent] || toolSets.general_chat;
    const selectedTools: Record<string, any> = {};
    for (const key of selectedKeys) {
        if (all[key]) selectedTools[key] = all[key];
    }
    return selectedTools;
}

function getAllAgentTools(boardId: string, workspaceId: string, userEmail: string) {
    return {

        // ═══════════════════════════════════════════════════
        // CATEGORY A: READ TOOLS (Progressive Retrieval)
        // ═══════════════════════════════════════════════════

        get_active_tasks: tool({
            description: 'Fetch a short, lightweight list of active (non-completed) tasks for the current user.',
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
            description: 'Search for tasks related to a specific keyword for the CURRENT USER.',
            parameters: z.object({
                query: z.string().describe('The search keyword')
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
            description: 'Fetch in-depth details about a single specific task.',
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

        get_my_workload_stats: tool({
            description: 'Get status-wise breakdown of tasks assigned to the CURRENT USER (e.g. Done: 5, To Do: 3).',
            parameters: z.object({
                _ignore: z.any().optional()
            }),
            execute: async () => {
                try {
                    const stats = await TaskReader.getUserWorkloadStats(boardId, workspaceId, userEmail);
                    return { success: true, ...stats };
                } catch (err: any) {
                    return { success: false, error: err.message };
                }
            }
        }),

        // ═══════════════════════════════════════════════════
        // CATEGORY B: MUTATION TOOLS (Authorized Writes)
        // ═══════════════════════════════════════════════════

        update_task_status: tool({
            description: 'Update a task status (e.g. To Do -> Done). ONLY for current user.',
            parameters: z.object({
                taskId: z.string().describe('The _id of the task'),
                taskNumber: z.string().describe('The task number'),
                status: z.string().describe('The new status (Done, In Progress, etc.)'),
                statusCategory: z.enum(['not_started', 'in_progress', 'completed']),
                percentageCompletion: z.number().optional()
            })
        }),

        update_task_priority: tool({
            description: 'Update the priority of a task (Low, Medium, High, Critical).',
            parameters: z.object({
                taskId: z.string(),
                taskNumber: z.string(),
                priority: z.enum(['Low', 'Medium', 'High', 'Critical'])
            })
        }),

        set_task_dates: tool({
            description: 'Set or update start/due dates for a task (ISO format).',
            parameters: z.object({
                taskId: z.string(),
                taskNumber: z.string(),
                startDate: z.string().optional(),
                dueDate: z.string().optional()
            })
        }),

        assign_task: tool({
            description: 'Reassign a task to another team member by email.',
            parameters: z.object({
                taskId: z.string(),
                taskNumber: z.string(),
                assigneeEmail: z.string()
            })
        }),

        add_task_comment: tool({
            description: 'Post a progress note or blocker comment on a task thread.',
            parameters: z.object({
                taskId: z.string(),
                taskNumber: z.string(),
                comment: z.string(),
                label: z.enum(['Progress Update', 'Blocker'])
            })
        }),

        create_task: tool({
            description: 'Create a new task on the board.',
            parameters: z.object({
                name: z.string(),
                priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
                assigneeEmail: z.string().optional()
            })
        }),

        create_subtask: tool({
            description: 'Create a subtask under a parent task.',
            parameters: z.object({
                parentTaskId: z.string(),
                name: z.string(),
                priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
                assigneeEmail: z.string().optional()
            })
        }),

        auto_generate_subtasks: tool({
            description: 'Generate subtask suggestions for a task. Returns metadata for brainstorm.',
            parameters: z.object({
                taskId: z.string().describe('Task ID')
            }),
            execute: async ({ taskId }) => {
                return { success: true, message: "Subtask context analyzed. Please suggest 3-5 subtasks now." };
            }
        }),

        // ═══════════════════════════════════════════════════
        // CATEGORY C: ANALYTICS & INTELLIGENCE TOOLS
        // ═══════════════════════════════════════════════════

        get_board_health: tool({
            description: 'Analyze board-wide health (overdue, stuck, unassigned).',
            parameters: z.object({
                _ignore: z.any().optional()
            }),
            execute: async () => {
                try {
                    const health = await TaskReader.getBoardHealth(boardId, workspaceId);
                    return { success: true, health };
                } catch (err: any) {
                    return { success: false, error: err.message };
                }
            }
        }),

        get_sprint_summary: tool({
            description: 'Metrics for current workload (completion, high priority).',
            parameters: z.object({
                _ignore: z.any().optional()
            }),
            execute: async () => {
                try {
                    const metrics = await TaskReader.getSprintMetrics(boardId, workspaceId);
                    return { success: true, metrics };
                } catch (err: any) {
                    return { success: false, error: err.message };
                }
            }
        }),

        detect_stuck_tasks: tool({
            description: 'Identify tasks with no activity for > 7 days.',
            parameters: z.object({
                threshold: z.number().optional().describe('Days (default 7)')
            }),
            execute: async ({ threshold }) => {
                try {
                    const tasks = await TaskReader.detectStuckTasks(boardId, workspaceId, threshold || 7);
                    return { success: true, tasks };
                } catch (err: any) {
                    return { success: false, error: err.message };
                }
            }
        }),

        predict_deadline_risk: tool({
            description: 'Predict tasks at risk (due < 7 days, low progress).',
            parameters: z.object({
                _ignore: z.any().optional()
            }),
            execute: async () => {
                try {
                    const risks = await TaskReader.predictDeadlineRisks(boardId, workspaceId);
                    return { success: true, risks };
                } catch (err: any) {
                    return { success: false, error: err.message };
                }
            }
        }),

        get_my_overdue_tasks: tool({
            description: 'Fetch current user\'s overdue tasks.',
            parameters: z.object({
                _ignore: z.any().optional()
            }),
            execute: async () => {
                try {
                    const tasks = await TaskReader.getMyOverdueTasks(boardId, workspaceId, userEmail);
                    return { success: true, tasks };
                } catch (err: any) {
                    return { success: false, error: err.message };
                }
            }
        }),

        check_standup_consistency: tool({
            description: 'Compare standup promises with current status.',
            parameters: z.object({
                _ignore: z.any().optional()
            }),
            execute: async () => {
                try {
                    await connectToDatabase();
                    const lastStandup = await Standup.findOne({ userEmail, boardId }).sort({ createdAt: -1 });
                    const currentTasks = await TaskReader.getActiveTasks(boardId, workspaceId, userEmail, 50);
                    return { success: true, lastStandup, currentTasks };
                } catch (err: any) {
                    return { success: false, error: err.message };
                }
            }
        }),

        get_past_standups: tool({
            description: 'Retrieve user\'s past standup records.',
            parameters: z.object({
                limit: z.number().optional()
            }),
            execute: async ({ limit }) => {
                try {
                    await connectToDatabase();
                    const standups = await Standup.find({ userEmail, boardId }).sort({ createdAt: -1 }).limit(limit || 3).lean();
                    return { success: true, standups };
                } catch (err: any) {
                    return { success: false, error: err.message };
                }
            }
        }),

        get_team_tasks: tool({
            description: 'View active tasks from the entire team (Read-only).',
            parameters: z.object({
                _ignore: z.any().optional()
            }),
            execute: async () => {
                try {
                    const tasks = await TaskReader.getTeamTasks(boardId, workspaceId, 10);
                    return { success: true, tasks };
                } catch (err: any) {
                    return { success: false, error: err.message };
                }
            }
        }),

        search_all_board_tasks: tool({
            description: 'Search across it ALL team tasks on the board.',
            parameters: z.object({
                query: z.string()
            }),
            execute: async ({ query }) => {
                try {
                    const results = await TaskReader.searchAllBoardTasks(boardId, workspaceId, query);
                    return { success: true, results };
                } catch (err: any) {
                    return { success: false, error: err.message };
                }
            }
        }),

        get_task_comments: tool({
            description: 'Fetch conversation history for a task.',
            parameters: z.object({
                taskId: z.string()
            }),
            execute: async ({ taskId }) => {
                try {
                    const comments = await TaskReader.getTaskComments(taskId);
                    return { success: true, comments };
                } catch (err: any) {
                    return { success: false, error: err.message };
                }
            }
        }),

        // ═══════════════════════════════════════════════════
        // CATEGORY D: DOCUMENT & SUMMARY TOOLS
        // ═══════════════════════════════════════════════════

        generate_daily_digest: tool({
            description: 'Daily team progress and risks summary.',
            parameters: z.object({
                _ignore: z.any().optional()
            }),
            execute: async () => {
                try {
                    const health = await TaskReader.getBoardHealth(boardId, workspaceId);
                    return { success: true, health };
                } catch (err: any) {
                    return { success: false, error: err.message };
                }
            }
        }),

        persist_standup: tool({
            description: 'PERMANENTLY SAVE the standup. DO NOT CALL THIS until you have interviewed the user for all 3 parts: Yesterday, Today, and Blockers.',
            parameters: z.object({
                yesterday: z.string().describe('Work completed yesterday'),
                today: z.string().describe('Plan for today'),
                blockers: z.string().describe('Any blockers or roadblocks (use "None" if clear)'),
                summary: z.string().optional().describe('Brief executive summary')
            })
        }),

        draft_document: tool({
            description: 'Draft markdown document (PRD, report, etc.).',
            parameters: z.object({
                title: z.string(),
                content: z.string()
            })
        })
    };
}
