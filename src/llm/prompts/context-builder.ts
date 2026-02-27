import { TaskWithSubtasks } from '@/types';

/**
 * Builds a plain-text task context from an array of tasks and subtasks 
 * to feed into the LLM context limits efficiently.
 */
export function buildTaskContext(tasks: TaskWithSubtasks[]): string {
    if (!tasks || tasks.length === 0) {
        return 'The user currently has no assigned tasks.';
    }

    return tasks.map(t => {
        let line = `Task ${t.taskNumber} | ID: ${t._id} | "${t.name}" | Status: ${t.status} | Priority: ${t.priority || 'Medium'} | Completion: ${t.percentageCompletion || 0}%`;

        if (t.subtasks && t.subtasks.length > 0) {
            line += '\n  Subtasks:\n' + t.subtasks.map(s =>
                `    ${s.subtaskNumber} | ID: ${s._id} | "${s.name}" | Status: ${s.status}`
            ).join('\n');
        }

        return line;
    }).join('\n\n');
}

/**
 * Generates the JSON reference list for the LLM extraction prompt
 */
export function buildTaskReferenceJson(tasks: TaskWithSubtasks[]): string {
    return JSON.stringify(
        tasks.map(t => ({
            _id: t._id,
            taskNumber: t.taskNumber,
            name: t.name
        })),
        null,
        2
    );
}
