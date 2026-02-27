import { z } from 'zod';

export const TaskUpdateSchema = z.object({
    _id: z.string(),
    taskNumber: z.string(),
    status: z.string(),
    statusCategory: z.enum(['not_started', 'in_progress', 'completed']),
    percentageCompletion: z.number().optional()
});

export const TaskCommentSchema = z.object({
    taskId: z.string(),
    taskNumber: z.string(),
    comment: z.string(),
    notifyLead: z.boolean().optional()
});

export const DependencyLinkSchema = z.object({
    taskId: z.string(),
    dependsOnTaskId: z.string()
});

export const RelationLinkSchema = z.object({
    taskId: z.string(),
    relatedToTaskId: z.string(),
    relationType: z.enum(['relates_to', 'duplicates'])
});

export const NewTaskSchema = z.object({
    name: z.string(),
    boardId: z.string(),
    workspaceId: z.string(),
    assigneeEmail: z.string(),
    status: z.literal('To Do'),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical'])
});

export const NewSubtaskSchema = NewTaskSchema.extend({
    parentTaskId: z.string()
});

export const NotificationSchema = z.object({
    type: z.string(),
    taskId: z.string(),
    taskName: z.string(),
    reason: z.string()
});

export const StandupOutputSchema = z.object({
    task_updates: z.array(TaskUpdateSchema),
    progress_comments: z.array(TaskCommentSchema),
    roadblock_comments: z.array(TaskCommentSchema),
    dependencies_to_add: z.array(DependencyLinkSchema),
    relations_to_add: z.array(RelationLinkSchema),
    new_tasks_to_create: z.array(NewTaskSchema),
    new_subtasks_to_create: z.array(NewSubtaskSchema),
    notifications_to_send: z.array(NotificationSchema),
    summary_for_lead: z.string()
});
