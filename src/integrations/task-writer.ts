import { skaryaClient } from './skarya-client';
import { WritebackResult, StandupOutput, TaskUpdate, TaskComment, NewTask, NewSubtask } from '@/types';

/**
 * TaskWriter executes the confirmed JSON updates against the skarya.ai backend
 */
export class TaskWriter {
    /**
     * Main entry point to apply all confirmed changes.
     * Operations are independent; one failure doesn't block others.
     */
    static async applyUpdates(output: StandupOutput): Promise<WritebackResult[]> {
        const results: WritebackResult[] = [];

        // 1. Task Updates (Status / Progress)
        for (const update of output.task_updates) {
            const res = await this.updateTaskStatus(update);
            results.push(res);
        }

        // 2. Progress Comments
        for (const comment of output.progress_comments) {
            const res = await this.addTaskComment(comment, 'Progress Update');
            results.push(res);
        }

        // 3. Roadblock Comments
        for (const comment of output.roadblock_comments) {
            const res = await this.addTaskComment(comment, 'Blocker');
            results.push(res);

            // If requested, we could trigger a notification here
            if (comment.notifyLead) {
                // notifyLead logic
            }
        }

        // 4. New Tasks
        for (const task of output.new_tasks_to_create) {
            const res = await this.createTask(task);
            results.push(res);
        }

        // 5. New Subtasks
        for (const subtask of output.new_subtasks_to_create) {
            const res = await this.createSubtask(subtask);
            results.push(res);
        }

        // (Dependencies and Relations would go here, omitting for basic prototype if unconfirmed)

        return results;
    }

    public static async updateTaskStatus(update: TaskUpdate): Promise<WritebackResult> {
        try {
            // Inferred endpoint from HAR reference for updating task: PATCH /api/boardTask/updateBoardTask
            const response = await skaryaClient.put(`/api/boardTask/updateBoardTask?id=${update._id}`, {
                status: update.status,
                statusCategory: update.statusCategory,
                percentageCompletion: update.percentageCompletion
            });

            if (response.success) {
                return { operation: `Update Task ${update.taskNumber}`, status: 'success' };
            }
            return { operation: `Update Task ${update.taskNumber}`, status: 'failed', error: response.message };
        } catch (e: any) {
            return { operation: `Update Task ${update.taskNumber}`, status: 'failed', error: e.message };
        }
    }

    public static async addTaskComment(comment: TaskComment, label: string): Promise<WritebackResult> {
        try {
            // Updated endpoint from HAR: POST /api/boardTaskComment/createBoardTaskComment
            const response = await skaryaClient.post(`/api/boardTaskComment/createBoardTaskComment`, {
                boardTaskId: comment.taskId,
                text: `**${label}:** ${comment.comment}`,
                isEdited: false,
                isRoadBlock: label === 'Blocker'
            });

            if (response.success) {
                return { operation: `Comment on ${comment.taskNumber}`, status: 'success' };
            }
            return { operation: `Comment on ${comment.taskNumber}`, status: 'failed', error: response.message };
        } catch (e: any) {
            return { operation: `Comment on ${comment.taskNumber}`, status: 'failed', error: e.message };
        }
    }

    public static async updateTaskPriority(taskId: string, taskNumber: string, priority: string): Promise<WritebackResult> {
        try {
            const response = await skaryaClient.put(`/api/boardTask/updateBoardTask?id=${taskId}`, {
                priority
            });
            if (response.success) {
                return { operation: `Update Priority ${taskNumber} to ${priority}`, status: 'success' };
            }
            return { operation: `Update Priority ${taskNumber}`, status: 'failed', error: response.message };
        } catch (e: any) {
            return { operation: `Update Priority ${taskNumber}`, status: 'failed', error: e.message };
        }
    }

    public static async setTaskDates(taskId: string, taskNumber: string, startDate?: string, dueDate?: string): Promise<WritebackResult> {
        try {
            const payload: any = {};
            if (startDate) payload.startDate = startDate;
            if (dueDate) payload.dueDate = dueDate;

            const response = await skaryaClient.put(`/api/boardTask/updateBoardTask?id=${taskId}`, payload);
            if (response.success) {
                return { operation: `Update Dates ${taskNumber}`, status: 'success' };
            }
            return { operation: `Update Dates ${taskNumber}`, status: 'failed', error: response.message };
        } catch (e: any) {
            return { operation: `Update Dates ${taskNumber}`, status: 'failed', error: e.message };
        }
    }

    public static async assignTask(taskId: string, taskNumber: string, assigneeEmail: string): Promise<WritebackResult> {
        try {
            const response = await skaryaClient.put(`/api/boardTask/updateBoardTask?id=${taskId}`, {
                assigneePrimary: { email: assigneeEmail, name: 'User' }
            });
            if (response.success) {
                return { operation: `Assign ${taskNumber} to ${assigneeEmail}`, status: 'success' };
            }
            return { operation: `Assign ${taskNumber}`, status: 'failed', error: response.message };
        } catch (e: any) {
            return { operation: `Assign ${taskNumber}`, status: 'failed', error: e.message };
        }
    }

    public static async createTask(task: NewTask): Promise<WritebackResult> {
        try {
            // Extracted from pulse.karyaa.ai dataagent schema
            const endpoint = `/api/boardTask/createBoardTask?boardId=${task.boardId}&workspaceId=${task.workspaceId}`;

            const payload = {
                name: task.name,
                description: '',
                assigneePrimary: task.assigneeEmail ? { email: task.assigneeEmail, name: 'User' } : null,
                assigneeGroup: null,
                collaborators: [],
                startDate: new Date().toISOString(),
                dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), // +7 days
                status: task.status || 'To Do',
                priority: task.priority || 'Medium',
                label: '',
                actualEffort: '',
                allocatedEffort: '',
                dealValue: 0,
                relation: [],
                dependency: [],
                milestone: false,
                percentageCompletion: 0,
                taskNumber: "0", // Backend typically replaces this
                customFieldValues: {},
                checklists: [],
                type: 'User Story',
                recurrence: {
                    enabled: false,
                    frequency: 'weekly',
                    interval: 1,
                    endType: 'never',
                    endAfter: 10,
                    endOn: new Date().toISOString(),
                    weekDays: [],
                    monthDay: 1,
                    yearMonth: 1,
                    customPattern: ''
                },
                createdBy: task.createdBy || 'Unknown User',
                statusCategory: 'not_started'
            };

            const response = await skaryaClient.post(endpoint, payload);

            if (response.success) {
                return { operation: `Create Task: ${task.name}`, status: 'success' };
            }
            return { operation: `Create Task: ${task.name}`, status: 'failed', error: response.message };
        } catch (e: any) {
            return { operation: `Create Task: ${task.name}`, status: 'failed', error: e.message };
        }
    }

    public static async createSubtask(subtask: NewSubtask): Promise<WritebackResult> {
        try {
            const endpoint = `/api/boardSubtask/createBoardSubtask`;
            const payload = {
                name: subtask.name,
                taskId: subtask.parentTaskId,
                assignee: { email: subtask.assigneeEmail, name: 'User' },
                priority: subtask.priority || 'Medium',
                status: subtask.status || 'To Do',
                dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
                startDate: new Date().toISOString(),
                description: '',
                checklist: [],
                createdBy: subtask.createdBy || 'Unknown User'
            };

            if (!subtask.boardId || !subtask.workspaceId) {
                throw new Error("Missing boardId or workspaceId for subtask creation.");
            }

            const response = await skaryaClient.post(`${endpoint}?boardId=${subtask.boardId}&workspaceId=${subtask.workspaceId}&taskId=${subtask.parentTaskId}`, payload);

            if (response.success) {
                return { operation: `Create Subtask: ${subtask.name}`, status: 'success' };
            }
            return { operation: `Create Subtask: ${subtask.name}`, status: 'failed', error: response.message };
        } catch (e: any) {
            return { operation: `Create Subtask: ${subtask.name}`, status: 'failed', error: e.message };
        }
    }
}
