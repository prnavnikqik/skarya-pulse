'use server';

import { TaskWriter } from '@/integrations/task-writer';

export async function executeSkaryaAction(toolName: string, args: Record<string, unknown>) {
  try {
    console.log(`[Server Action] Executing ${toolName} with args:`, args);

    const authMeta = args._authMeta as { userEmail: string, workspaceId: string, boardId: string } | undefined;

    // Shared helper to get required board context
    const getBoardCtx = () => {
      const boardId = args.boardId ? String(args.boardId) : authMeta?.boardId;
      const workspaceId = args.workspaceId ? String(args.workspaceId) : authMeta?.workspaceId;
      if (!boardId || !workspaceId) throw new Error('Missing boardId or workspaceId — cannot perform this action.');
      return { boardId, workspaceId };
    };

    // ─── UPDATE TASK STATUS ───────────────────────────────────────────────────
    if (toolName === 'update_task_status') {
      // Security Validation: Cross-reference Assignee
      if (authMeta) {
        const { TaskReader } = await import('@/integrations/task-reader');
        const userTasks = await TaskReader.fetchUserTasks(authMeta.boardId, authMeta.workspaceId, authMeta.userEmail);
        const taskBelongsToUser = userTasks.some(t => String(t._id) === String(args.taskId) || String(t.taskNumber) === String(args.taskNumber));
        if (!taskBelongsToUser) {
          throw new Error(`Unauthorized: You cannot update a task assigned to someone else.`);
        }
      }

      const result = await TaskWriter.updateTaskStatus({
        _id: String(args.taskId || ''),
        taskNumber: String(args.taskNumber || ''),
        status: String(args.status || ''),
        statusCategory: args.statusCategory as 'not_started' | 'in_progress' | 'completed',
        percentageCompletion: args.percentageCompletion ? Number(args.percentageCompletion) : undefined
      });
      return { success: result.status === 'success', result };
    }

    // ─── UPDATE TASK PRIORITY ─────────────────────────────────────────────────
    if (toolName === 'update_task_priority') {
      if (!args.taskId || !args.taskNumber || !args.priority) {
        throw new Error('Missing required fields: taskId, taskNumber, priority');
      }
      const result = await TaskWriter.updateTaskPriority(
        String(args.taskId), String(args.taskNumber), String(args.priority)
      );
      return { success: result.status === 'success', result };
    }

    // ─── SET TASK DATES ───────────────────────────────────────────────────────
    if (toolName === 'set_task_dates') {
      if (!args.taskId || !args.taskNumber) throw new Error('Missing required fields: taskId, taskNumber');
      const result = await TaskWriter.setTaskDates(
        String(args.taskId), String(args.taskNumber),
        args.startDate ? String(args.startDate) : undefined,
        args.dueDate ? String(args.dueDate) : undefined
      );
      return { success: result.status === 'success', result };
    }

    // ─── ASSIGN TASK ──────────────────────────────────────────────────────────
    if (toolName === 'assign_task') {
      if (!args.taskId || !args.taskNumber || !args.assigneeEmail) {
        throw new Error('Missing required fields: taskId, taskNumber, assigneeEmail');
      }
      const result = await TaskWriter.assignTask(
        String(args.taskId), String(args.taskNumber), String(args.assigneeEmail)
      );
      return { success: result.status === 'success', result };
    }

    // ─── ADD TASK COMMENT (label-aware routing) ───────────────────────────────
    if (toolName === 'add_task_comment') {
      if (!args.taskId || !args.comment) throw new Error('Missing required fields: taskId, comment');
      const label = String(args.label || 'Progress Update');
      const isBlocker = label === 'Blocker';

      const comment = {
        taskId: String(args.taskId),
        taskNumber: String(args.taskNumber || ''),
        comment: String(args.comment)
      };

      const results = await TaskWriter.applyUpdates({
        task_updates: [],
        progress_comments: isBlocker ? [] : [comment],
        roadblock_comments: isBlocker ? [comment] : [],
        dependencies_to_add: [],
        relations_to_add: [],
        new_tasks_to_create: [],
        new_subtasks_to_create: [],
        notifications_to_send: [],
        summary_for_lead: ''
      });
      return { success: true, results };
    }

    // ─── CREATE TASK ──────────────────────────────────────────────────────────
    if (toolName === 'create_task') {
      if (!args.name) throw new Error('Task name is required.');
      const { boardId, workspaceId } = getBoardCtx();
      const result = await TaskWriter.createTask({
        name: String(args.name),
        boardId,
        workspaceId,
        assigneeEmail: args.assigneeEmail ? String(args.assigneeEmail) : (authMeta?.userEmail || ''),
        status: 'To Do',
        priority: (args.priority ? String(args.priority) : 'Medium') as 'Low' | 'Medium' | 'High' | 'Critical',
        createdBy: authMeta?.userEmail || 'Unknown'
      });
      return { success: result.status === 'success', result };
    }

    // ─── CREATE SUBTASK ───────────────────────────────────────────────────────
    if (toolName === 'create_subtask') {
      if (!args.name || !args.parentTaskId) throw new Error('Subtask name and parentTaskId are required.');
      const { boardId, workspaceId } = getBoardCtx();
      const result = await TaskWriter.createSubtask({
        parentTaskId: String(args.parentTaskId),
        name: String(args.name),
        boardId,
        workspaceId,
        assigneeEmail: args.assigneeEmail ? String(args.assigneeEmail) : (authMeta?.userEmail || ''),
        status: 'To Do',
        priority: (args.priority ? String(args.priority) : 'Medium') as 'Low' | 'Medium' | 'High' | 'Critical',
        createdBy: authMeta?.userEmail || 'Unknown'
      });
      return { success: result.status === 'success', result };
    }

    // ─── DRAFT DOCUMENT ───────────────────────────────────────────────────────
    if (toolName === 'draft_document') {
      if (!args.title || !args.content) throw new Error('Document title and content are required.');
      return { success: true, message: `Document ready: ${args.title}`, draftedContent: args.content };
    }

    return { success: false, error: `Unknown action: ${toolName}` };
  } catch (error: Error | unknown) {
    console.error('[Server Action Error]', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
