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

        // Endpoint from docs: GET /api/boardTask/getBoardTask
        // (Assuming we use the general one and filter, or we could use getFilteredAssignee but getBoardTask is safe)
        const response = await skaryaClient.get<SkaryaTask[]>('/api/boardTask/getBoardTask', {
            boardId,
            workspaceId
        });

        if (!response.success || !response.data) {
            throw new Error(`Failed to fetch tasks: ${response.message || 'Unknown error'}`);
        }

        const allTasks = response.data;

        // Filter tasks logically based on assignee or collaborators
        const userTasks = allTasks.filter(task => {
            const isAssignee = task.assigneePrimary?.email === userEmail;
            const isCollaborator = task.collaborators?.includes(userEmail);
            return isAssignee || isCollaborator;
        });

        console.log(`[TaskReader] Found ${userTasks.length} tasks relevant to the user.`);

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
