'use server';

import { TaskWriter } from '@/integrations/task-writer';

export async function executeSkaryaAction(toolName: string, args: Record<string, unknown>) {
  try {
    console.log(`[Server Action] Executing ${toolName} with args:`, args);

    if (toolName === 'update_task_status') {
      const res = await TaskWriter.applyUpdates({
        task_updates: [{
          _id: String(args.taskId || ''),
          taskNumber: String(args.taskNumber || ''),
          status: String(args.status || ''),
          statusCategory: args.statusCategory as 'not_started' | 'in_progress' | 'completed',
          percentageCompletion: args.percentageCompletion ? Number(args.percentageCompletion) : undefined
        }],
        progress_comments: [],
        roadblock_comments: [],
        dependencies_to_add: [],
        relations_to_add: [],
        new_tasks_to_create: [],
        new_subtasks_to_create: [],
        notifications_to_send: [],
        summary_for_lead: ''
      });
      return { success: true, results: res };
    }

    if (toolName === 'add_task_comment') {
      const res = await TaskWriter.applyUpdates({
        task_updates: [],
        progress_comments: [{
          taskId: String(args.taskId || ''),
          taskNumber: String(args.taskNumber || ''),
          comment: String(args.comment || '')
        }],
        roadblock_comments: [],
        dependencies_to_add: [],
        relations_to_add: [],
        new_tasks_to_create: [],
        new_subtasks_to_create: [],
        notifications_to_send: [],
        summary_for_lead: ''
      });
      return { success: true, results: res };
    }

    if (toolName === 'create_task') {
      const res = await TaskWriter.applyUpdates({
        task_updates: [],
        progress_comments: [],
        roadblock_comments: [],
        dependencies_to_add: [],
        relations_to_add: [],
        new_tasks_to_create: [{
          ...(args as Record<string, unknown> as any),
          boardId: args.boardId ? String(args.boardId) : '69a2118ecf1d73e568280ba5', // Staging default
          workspaceId: args.workspaceId ? String(args.workspaceId) : '69a202afcf1d73e568280529' // Staging default
        }],
        new_subtasks_to_create: [],
        notifications_to_send: [],
        summary_for_lead: ''
      });
      return { success: true, results: res };
    }

    if (toolName === 'create_subtask') {
      const res = await TaskWriter.applyUpdates({
        task_updates: [],
        progress_comments: [],
        roadblock_comments: [],
        dependencies_to_add: [],
        relations_to_add: [],
        new_tasks_to_create: [],
        new_subtasks_to_create: [{
          ...(args as Record<string, unknown> as any),
          boardId: args.boardId ? String(args.boardId) : '69a2118ecf1d73e568280ba5', // Staging default
          workspaceId: args.workspaceId ? String(args.workspaceId) : '69a202afcf1d73e568280529' // Staging default
        }],
        notifications_to_send: [],
        summary_for_lead: ''
      });
      return { success: true, results: res };
    }

    return { success: false, error: 'Unknown tool name' };
  } catch (error: Error | unknown) {
    console.error('[Server Action Error]', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
