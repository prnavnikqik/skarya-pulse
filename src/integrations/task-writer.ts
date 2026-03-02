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

        // (Dependencies and Relations would go here, omitting for basic prototype if unconfirmed)

        return results;
    }

    private static async updateTaskStatus(update: TaskUpdate): Promise<WritebackResult> {
        try {
            // Inferred endpoint from HAR reference for updating task: PATCH /api/boardTask/updateBoardTask
            const response = await skaryaClient.patch(`/api/boardTask/updateBoardTask?id=${update._id}`, {
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

    private static async addTaskComment(comment: TaskComment, label: string): Promise<WritebackResult> {
        try {
            // Inferred endpoint from HAR reference for commenting: POST /api/boardTaskComment/addBoardTaskComment
            // In a real app we'd need workspaceId and boardId from context, 
            // but for prototype we assume the API handles it or we'd pass it down.
            const response = await skaryaClient.post(`/api/boardTaskComment/addBoardTaskComment`, {
                taskId: comment.taskId,
                text: `**${label}:** ${comment.comment}`
            });

            if (response.success) {
                return { operation: `Comment on ${comment.taskNumber}`, status: 'success' };
            }
            return { operation: `Comment on ${comment.taskNumber}`, status: 'failed', error: response.message };
        } catch (e: any) {
            return { operation: `Comment on ${comment.taskNumber}`, status: 'failed', error: e.message };
        }
    }

    private static async createTask(task: NewTask): Promise<WritebackResult> {
        try {
            // Extracted from pulse.karyaa.ai dataagent schema
            const endpoint = `/api/boardTask/createBoardTask?boardId=${task.boardId}&workspaceId=${task.workspaceId}`;

            const payload = {
                name: task.name,
                description: '',
                assigneePrimary: task.assigneeEmail,
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
                createdBy: 'pranav.patil@nikqik.com', // Demo fallback
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
}
