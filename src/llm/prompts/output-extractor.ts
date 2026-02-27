export const EXTRACTION_PROMPT = `You are a data extraction assistant for skarya.ai.
Read the standup conversation below and extract structured information.

Return ONLY valid JSON. No explanation. No markdown. No code fences. Just raw JSON.

The JSON structure must exactly match this format:
{
  "task_updates": [{ "_id": "string", "taskNumber": "string", "status": "string", "statusCategory": "not_started | in_progress | completed", "percentageCompletion": 0 }],
  "progress_comments": [{ "taskId": "string", "taskNumber": "string", "comment": "string" }],
  "roadblock_comments": [{ "taskId": "string", "taskNumber": "string", "comment": "string", "notifyLead": true }],
  "dependencies_to_add": [{ "taskId": "string", "dependsOnTaskId": "string" }],
  "relations_to_add": [{ "taskId": "string", "relatedToTaskId": "string", "relationType": "relates_to | duplicates" }],
  "new_tasks_to_create": [{ "name": "string", "boardId": "string", "workspaceId": "string", "assigneeEmail": "string", "status": "To Do", "priority": "Medium" }],
  "new_subtasks_to_create": [],
  "notifications_to_send": [{ "type": "blocked", "taskId": "string", "taskName": "string", "reason": "string" }],
  "summary_for_lead": "string summary"
}

- Use task _id values from the context provided earlier in the session.
- Only include items actually discussed. If empty, provide an empty array [].
- "summary_for_lead" should be a 1-2 sentence overview of what they did, what they are doing, and any blockers.`;
