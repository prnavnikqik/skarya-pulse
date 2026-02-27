'use server';

import { TaskWriter } from '@/integrations/task-writer';

export async function executeSkaryaAction(toolName: string, args: any) {
  try {
    console.log(`[Server Action] Executing ${toolName} with args:`, args);

    if (toolName === 'update_task_status') {
      const res = await TaskWriter.applyUpdates({
        task_updates: [{
          _id: args.taskId,
          taskNumber: args.taskNumber,
          status: args.status,
          statusCategory: args.statusCategory,
          percentageCompletion: args.percentageCompletion
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
          taskId: args.taskId,
          taskNumber: args.taskNumber,
          comment: args.comment
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
          ...args,
          boardId: '694a87f7e6aa80a347e86e5a', // Demo default
          workspaceId: '692ba14ce2552a8b5afe6e9a' // Demo default
        }],
        new_subtasks_to_create: [],
        notifications_to_send: [],
        summary_for_lead: ''
      });
      return { success: true, results: res };
    }

    return { success: false, error: 'Unknown tool name' };
  } catch (error: any) {
    console.error('[Server Action Error]', error);
    return { success: false, error: error.message };
  }
}
