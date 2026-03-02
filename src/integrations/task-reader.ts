import { skaryaClient } from './skarya-client';
import { SkaryaTask, SkaryaSubtask, TaskWithSubtasks } from '@/types';

/**
 * Reads tasks and their subtasks from skarya.ai.
 */
export class TaskReader {
    /**
     * Fetches all tasks for a particular user in a board.
     * If `userEmail` is provided, it filters the tasks for this user.
     */
    static async fetchUserTasks(
        boardId: string,
        workspaceId: string,
        userEmail: string
    ): Promise<TaskWithSubtasks[]> {
        console.log(`[TaskReader] Fetching tasks for ${userEmail} in board ${boardId}`);

        // We use the general board task endpoint to avoid 500 errors from strict filtered assignments
        const response = await skaryaClient.get<any>('/api/boardTask/getBoardTask', {
            boardId,
            workspaceId
        });

        if (!response.success || !response.data) {
            throw new Error(`Failed to fetch tasks: ${response.message || 'Unknown error'}`);
        }

        // the endpoint returns data directly as an array or inside tasks. We'll handle both.
        const allTasks: SkaryaTask[] = Array.isArray(response.data) ? response.data : ((response.data as any)?.tasks || []);

        // Filter tasks logically based on assignee or collaborators
        const userTasks = allTasks.filter((task: any) => {
            // Skarya's API structure for assignee varies. We will deeply scan for the email string.
            const taskString = JSON.stringify(task).toLowerCase();
            return taskString.includes(String(userEmail).toLowerCase());
        });

        console.log(`[TaskReader] Found ${userTasks.length} tasks relevant to the user after fetching.`);

        // For each task, fetch subtasks
        const tasksWithSubtasks: TaskWithSubtasks[] = await Promise.all(
            userTasks.map(async (task) => {
                const subtasksResponse = await skaryaClient.get<SkaryaSubtask[]>('/api/boardSubtask/getBoardSubtask', {
                    boardId,
                    taskId: task._id,
                    workspaceId
                });

                // If subtasks endpoint fails or is empty, we just append empty array
                const subtasks = (subtasksResponse.success && subtasksResponse.data) ? subtasksResponse.data : [];

                // Filter subtasks by assignee
                const userSubtasks = subtasks.filter(sub => sub.assignee?.email === userEmail);

                return {
                    ...task,
                    subtasks: userSubtasks
                };
            })
        );

        return tasksWithSubtasks;
    }

    /**
     * Verifies if a user has access to a specific board.
     */
    static async verifyBoardAccess(boardId: string, userEmail: string): Promise<boolean> {
        const response = await skaryaClient.get<any>('/api/boards/getBoardById&Access', {
            id: boardId,
            email: userEmail
        });

        return response.success;
    }
}
