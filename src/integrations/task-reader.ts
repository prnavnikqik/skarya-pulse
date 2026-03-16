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
            const isAssignee = task.assigneePrimary?.email?.toLowerCase() === userEmail.toLowerCase();
            const isCollaborator = task.collaborators?.some((c: any) => c.email?.toLowerCase() === userEmail.toLowerCase());
            return isAssignee || isCollaborator;
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
        const userTasks = allTasks.filter((task: any) => {
            const isAssignee = task.assigneePrimary?.email?.toLowerCase() === userEmail.toLowerCase();
            const isCollaborator = task.collaborators?.some((c: any) => c.email?.toLowerCase() === userEmail.toLowerCase());
            return isAssignee || isCollaborator;
        });

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
     * Agent Tool: Get status-wise task counts for the current user.
     */
    static async getUserWorkloadStats(
        boardId: string,
        workspaceId: string,
        userEmail: string
    ) {
        const response = await skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
        if (!response.success || !response.data) throw new Error(`Failed to fetch tasks`);
        const allTasks: SkaryaTask[] = Array.isArray(response.data) ? response.data : ((response.data as any)?.tasks || []);

        const userTasks = allTasks.filter((task: any) => {
            const isAssignee = task.assigneePrimary?.email?.toLowerCase() === userEmail.toLowerCase();
            const isCollaborator = task.collaborators?.some((c: any) => c.email?.toLowerCase() === userEmail.toLowerCase());
            return isAssignee || isCollaborator;
        });

        const stats: Record<string, number> = {};
        userTasks.forEach(t => {
            const status = t.status || 'Unknown';
            stats[status] = (stats[status] || 0) + 1;
        });

        return {
            total: userTasks.length,
            breakdown: stats
        };
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

        const userTasks = allTasks.filter((task: any) => {
            const isAssignee = task.assigneePrimary?.email?.toLowerCase() === userEmail.toLowerCase();
            const isCollaborator = task.collaborators?.some((c: any) => c.email?.toLowerCase() === userEmail.toLowerCase());
            return isAssignee || isCollaborator;
        });

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
     * Agent Tool: Board Health Analytics.
     * Scans the full board for overdue tasks, stuck items, and unassigned work.
     */
    static async getBoardHealth(boardId: string, workspaceId: string) {
        const response = await skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
        if (!response.success || !response.data) {
            console.error("Failed response in getBoardHealth:", response);
            throw new Error('Failed to fetch board tasks');
        }
        const allTasks: SkaryaTask[] = Array.isArray(response.data) ? response.data : ((response.data as any)?.tasks || []);

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const overdue = allTasks.filter(t => {
            if (t.status === 'Done' || t.statusCategory === 'completed') return false;
            return t.dueDate && new Date(t.dueDate) < now;
        });

        const stuckInProgress = allTasks.filter(t => {
            if (t.statusCategory !== 'in_progress') return false;
            return t.startDate && new Date(t.startDate) < sevenDaysAgo;
        });

        const noAssignee = allTasks.filter(t => {
            if (t.status === 'Done' || t.statusCategory === 'completed') return false;
            return !t.assigneePrimary || !t.assigneePrimary.email;
        });

        const dueSoon = allTasks.filter(t => {
            if (t.status === 'Done' || t.statusCategory === 'completed') return false;
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
            return due >= now && due <= twoDaysFromNow;
        });

        return {
            totalTasks: allTasks.length,
            activeTasks: allTasks.filter(t => t.statusCategory !== 'completed').length,
            overdue: overdue.slice(0, 10).map(t => ({ id: t._id, name: t.name, dueDate: t.dueDate, assignee: t.assigneePrimary?.name })),
            stuckInProgress: stuckInProgress.slice(0, 10).map(t => ({ id: t._id, name: t.name, startDate: t.startDate, assignee: t.assigneePrimary?.name })),
            noAssignee: noAssignee.slice(0, 10).map(t => ({ id: t._id, name: t.name })),
            dueSoon: dueSoon.slice(0, 10).map(t => ({ id: t._id, name: t.name, dueDate: t.dueDate, assignee: t.assigneePrimary?.name }))
        };
    }

    /**
     * Extracts unique team members assigned to tasks on a given board.
     */
    static async getTeamMembers(boardId: string, workspaceId: string) {
        const response = await skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
        if (!response.success || !response.data) return [];
        const allTasks: SkaryaTask[] = Array.isArray(response.data) ? response.data : ((response.data as any)?.tasks || []);

        const memberMap = new Map<string, any>();
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
        
        allTasks.forEach(t => {
            const assignee = t.assigneePrimary;
            if (assignee && assignee.email) {
                if (!memberMap.has(assignee.email)) {
                    // Simple hash for consistent coloring
                    const colorIndex = assignee.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
                    memberMap.set(assignee.email, {
                        id: (assignee as any)._id || assignee.email,
                        name: assignee.name || assignee.email.split('@')[0],
                        email: assignee.email,
                        role: 'Team Member',
                        avatar: (assignee.name || assignee.email).substring(0, 2).toUpperCase(),
                        status: 'Online', // Placeholder
                        bg: colors[colorIndex]
                    });
                }
            }
            
            // Also add collaborators if they exist
            if (t.collaborators && Array.isArray(t.collaborators)) {
                t.collaborators.forEach((collab: any) => {
                    if (collab && collab.email && !memberMap.has(collab.email)) {
                        const colorIndex = collab.email.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % colors.length;
                        memberMap.set(collab.email, {
                            id: collab._id || collab.email,
                            name: collab.name || collab.email.split('@')[0],
                            email: collab.email,
                            role: 'Collaborator',
                            avatar: (collab.name || collab.email).substring(0, 2).toUpperCase(),
                            status: 'Online',
                            bg: colors[colorIndex]
                        });
                    }
                });
            }
        });

        return Array.from(memberMap.values());
    }

    /**
     * Agent Tool: Get all team tasks (read-only, no user filtering).
     * Used for dependency detection in standup.
     */
    static async getTeamTasks(boardId: string, workspaceId: string, limit: number = 10) {
        const response = await skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
        if (!response.success || !response.data) throw new Error('Failed to fetch board tasks');
        const allTasks: SkaryaTask[] = Array.isArray(response.data) ? response.data : ((response.data as any)?.tasks || []);

        const activeTasks = allTasks.filter(t => t.statusCategory !== 'completed');
        return activeTasks.slice(0, limit).map(t => ({
            id: t._id,
            name: t.name,
            status: t.status,
            assignee: t.assigneePrimary?.name || 'Unassigned',
            priority: t.priority,
            dueDate: t.dueDate
        }));
    }

    /**
     * Agent Tool: Get task comments.
     * Guesses endpoint based on Skarya naming conventions.
     */
    static async getTaskComments(taskId: string): Promise<any[]> {
        try {
            const response = await skaryaClient.get<any[]>('/api/boardTaskComment/getBoardTaskComment', { taskId });
            return response.success && Array.isArray(response.data) ? response.data : [];
        } catch (e) {
            console.error('[TaskReader] getTaskComments failed:', e);
            return [];
        }
    }

    /**
     * Agent Tool: Sprint Intelligence.
     * Aggregates metrics for the current board state.
     */
    static async getSprintMetrics(boardId: string, workspaceId: string) {
        const response = await skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
        if (!response.success || !response.data) throw new Error('Failed to fetch board tasks');
        const allTasks: SkaryaTask[] = Array.isArray(response.data) ? response.data : ((response.data as any)?.tasks || []);

        const stats = {
            total: allTasks.length,
            completed: allTasks.filter(t => t.statusCategory === 'completed').length,
            inProgress: allTasks.filter(t => t.statusCategory === 'in_progress').length,
            notStarted: allTasks.filter(t => t.statusCategory === 'not_started').length,
            highPriority: allTasks.filter(t => (t.priority === 'High' || t.priority === 'Critical') && t.statusCategory !== 'completed').length
        };

        return {
            ...stats,
            completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
        };
    }

    /**
     * Agent Tool: Detect stuck tasks (no movement for X days).
     */
    static async detectStuckTasks(boardId: string, workspaceId: string, daysThreshold: number = 7) {
        const response = await skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
        if (!response.success || !response.data) throw new Error('Failed to fetch board tasks');
        const allTasks: SkaryaTask[] = Array.isArray(response.data) ? response.data : ((response.data as any)?.tasks || []);

        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

        const stuckTasks = allTasks.filter(t => {
            if (t.statusCategory === 'completed') return false;
            // Assuming startDate is the last movement indicator if updatedAt isn't available
            const lastActive = t.startDate ? new Date(t.startDate) : new Date(0);
            return lastActive < thresholdDate;
        });

        return stuckTasks.slice(0, 10).map(t => ({
            id: t._id,
            name: t.name,
            assignee: t.assigneePrimary?.name || 'Unassigned',
            status: t.status,
            lastActive: t.startDate
        }));
    }

    /**
     * Agent Tool: Predict deadline risks.
     */
    static async predictDeadlineRisks(boardId: string, workspaceId: string) {
        const response = await skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
        if (!response.success || !response.data) throw new Error('Failed to fetch board tasks');
        const allTasks: SkaryaTask[] = Array.isArray(response.data) ? response.data : ((response.data as any)?.tasks || []);

        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        const risks = allTasks.filter(t => {
            if (t.statusCategory === 'completed') return false;
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            // Risk if due within 7 days and still not started/low percentage
            return due < nextWeek && (t.statusCategory === 'not_started' || t.percentageCompletion < 50);
        });

        return risks.slice(0, 10).map(t => ({
            id: t._id,
            name: t.name,
            dueDate: t.dueDate,
            completion: t.percentageCompletion,
            assignee: t.assigneePrimary?.name
        }));
    }

    /**
     * Agent Tool: Search all board tasks (global search).
     */
    static async searchAllBoardTasks(boardId: string, workspaceId: string, query: string) {
        const response = await skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
        if (!response.success || !response.data) throw new Error('Failed to fetch board tasks');
        const allTasks: SkaryaTask[] = Array.isArray(response.data) ? response.data : ((response.data as any)?.tasks || []);

        const lowerQuery = query.toLowerCase();
        const results = allTasks.filter(t =>
            t.name.toLowerCase().includes(lowerQuery) ||
            (t as any).description?.toLowerCase().includes(lowerQuery)
        );

        return results.slice(0, 15).map(t => ({
            id: t._id,
            name: t.name,
            status: t.status,
            assignee: t.assigneePrimary?.name
        }));
    }

    /**
     * Agent Tool: Get my overdue tasks.
     */
    static async getMyOverdueTasks(boardId: string, workspaceId: string, userEmail: string) {
        const response = await skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
        if (!response.success || !response.data) {
            console.error('[TaskReader] getMyOverdueTasks failed:', response.message);
            return [];
        }
        const allTasks: SkaryaTask[] = Array.isArray(response.data) ? response.data : ((response.data as any)?.tasks || []);

        const now = new Date();
        const myOverdue = allTasks.filter(t => {
            const isAssignee = t.assigneePrimary?.email?.toLowerCase() === userEmail.toLowerCase();
            const isCollaborator = t.collaborators?.some((c: any) => (c as any).email?.toLowerCase() === userEmail.toLowerCase());
            const isMine = isAssignee || isCollaborator;

            if (!isMine || t.statusCategory === 'completed') return false;
            return t.dueDate && new Date(t.dueDate) < now;
        });

        return myOverdue.map(t => ({
            id: t._id,
            name: t.name,
            dueDate: t.dueDate,
            status: t.status
        }));
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

