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
     * Agent Tool 1: Fetches a lightweight list of active tasks for the user without subtasks.
     * Use this for general context gathering.
     */
    static async getActiveTasks(
        boardId: string,
        workspaceId: string,
        userEmail: string,
        limit: number = 5
    ) {
        // Fetch all board tasks
        const response = await skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
        if (!response.success || !response.data) throw new Error(`Failed to fetch tasks`);
        const allTasks: SkaryaTask[] = Array.isArray(response.data) ? response.data : ((response.data as any)?.tasks || []);

        // Filter for user
        const userTasks = allTasks.filter((task: any) => JSON.stringify(task).toLowerCase().includes(String(userEmail).toLowerCase()));

        // Filter active map and limit
        const activeTasks = userTasks.filter(t => t.status !== 'Done' && t.status !== 'Completed');
        return activeTasks.slice(0, limit).map(t => ({
            id: t._id,
            name: t.name,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate
        }));
    }

    /**
     * Agent Tool 2: Semantic/Keyword Search for Tasks.
     * Uses in-memory filtering since we don't have a Vector DB setup for the external API yet.
     */
    static async searchUserTasks(
        boardId: string,
        workspaceId: string,
        userEmail: string,
        query: string,
        limit: number = 5
    ) {
        const response = await skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
        if (!response.success || !response.data) throw new Error(`Failed to fetch tasks`);
        const allTasks: SkaryaTask[] = Array.isArray(response.data) ? response.data : ((response.data as any)?.tasks || []);

        const userTasks = allTasks.filter((task: any) => JSON.stringify(task).toLowerCase().includes(String(userEmail).toLowerCase()));

        // Pseudo-semantic search: simple keyword matching across the stringified task
        const queryTerms = query.toLowerCase().split(' ').filter(t => t.length > 2);

        const scoredTasks = userTasks.map(task => {
            const taskStr = JSON.stringify(task).toLowerCase();
            let score = 0;
            for (const term of queryTerms) {
                if (taskStr.includes(term)) score++;
            }
            return { task, score };
        }).filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return scoredTasks.map(item => ({
            id: item.task._id,
            name: item.task.name,
            status: item.task.status
        }));
    }

    /**
     * Agent Tool 3: Progressive Retrieval - fetches rich details for a single specific task.
     */
    static async getTaskDetails(boardId: string, workspaceId: string, taskId: string) {
        const response = await skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
        if (!response.success || !response.data) throw new Error(`Failed to fetch tasks`);
        const allTasks: SkaryaTask[] = Array.isArray(response.data) ? response.data : ((response.data as any)?.tasks || []);

        const task = allTasks.find((t: any) => t._id === taskId);
        if (!task) return { error: `Task ${taskId} not found on board.` };

        const subtasksResponse = await skaryaClient.get<SkaryaSubtask[]>('/api/boardSubtask/getBoardSubtask', {
            boardId, taskId, workspaceId
        });
        const subtasks = (subtasksResponse.success && subtasksResponse.data) ? subtasksResponse.data : [];

        return {
            id: task._id,
            name: task.name,
            status: task.status,
            priority: task.priority,
            description: (task as any).description || 'No description provided.',
            dueDate: task.dueDate,
            subtasks: subtasks.map(s => ({ title: s.name, status: s.status, assigneeEmail: s.assignee?.email }))
        };
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
