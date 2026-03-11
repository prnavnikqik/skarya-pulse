'use server';

import { TaskReader } from '@/integrations/task-reader';

export async function fetchBlockerRadar(boardId: string, workspaceId: string) {
  try {
    const stuckTasks = await TaskReader.detectStuckTasks(boardId, workspaceId, 7);
    return { success: true, tasks: stuckTasks };
  } catch (error: any) {
    console.error("fetchBlockerRadar error:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchTeamAnalytics(boardId: string, workspaceId: string) {
  try {
    const health = await TaskReader.getBoardHealth(boardId, workspaceId);
    const members = await TaskReader.getTeamMembers(boardId, workspaceId);
    return { success: true, health, members };
  } catch (error: any) {
    console.error("fetchTeamAnalytics error:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchSprintSummaries(boardId: string, workspaceId: string) {
  try {
    const metrics = await TaskReader.getSprintMetrics(boardId, workspaceId);
    return { success: true, metrics };
  } catch (error: any) {
    console.error("fetchSprintSummaries error:", error);
    return { success: false, error: error.message };
  }
}
