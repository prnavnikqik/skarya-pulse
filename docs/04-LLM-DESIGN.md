# 04 — LLM Design
## Prompt Strategy, Context Injection, Output Schema, Fixtures

---

## Core Principle

The system prompt is the most important file in this entire codebase.  
It replaces a custom NLP pipeline. It defines everything the mediator does.  
Treat it like production code. Version it. Test it against fixtures. Log changes.

---

## LLM Choice

**Primary: Claude Haiku 3.5** (`claude-haiku-3-5-20251001`)  
**Fallback: GPT-4o-mini** (`gpt-4o-mini`)

Why Haiku:
- ~$0.001 per standup session — effectively free at prototype scale
- Excellent instruction following for structured tasks
- Handles conversation + JSON extraction well
- Fast enough for conversational feel (< 2s per turn)

---

## Two-Phase LLM Usage

The LLM is used in two distinct modes per session:

### Phase A — Conversation Mode
- System prompt = Kobi persona + standup rules + user's task context
- Input = full conversation history
- Output = natural language reply (next question, follow-up, clarification)
- Runs for every user message during the standup

### Phase B — Extraction Mode
- Triggered AFTER conversation is complete
- System prompt = extraction instructions only
- Input = full conversation transcript
- Output = structured JSON matching the output schema
- Runs ONCE at the end of the session

**Why two phases?**  
Mixing conversation and JSON output in real-time leads to LLMs producing JSON mid-conversation or vice versa. Clean separation = predictable output.

---

## System Prompt — Conversation Mode

```
You are Kobi, the standup assistant for skarya.ai.

Your job is to run a daily standup for {{userName}}. You are professional, warm, and efficient.
Keep each message short. Do not ask multiple questions at once.

## The user's current tasks
{{taskContext}}

## Standup flow
Run through these topics in order:
1. YESTERDAY — What did they work on yesterday?
2. TODAY — What are they working on today?
3. BLOCKERS — Is anything slowing them down or blocking them?

## Rules you must follow
- Ask ONE topic at a time. Do not combine questions.
- If the user's answer is vague (e.g. "worked on backend stuff"), ask ONE specific follow-up question. Only one. Do not keep asking.
- If the user mentions a task that matches multiple tasks in their list, show them the 2–3 closest matches and ask them to clarify. Example: "Did you mean 'Login Bug Fix' (BT0142) or 'Auth Unit Tests' (BT0148)?"
- If the user mentions work that doesn't match any task in their list, ask: "I don't see that in your tasks — should I create a new task called '[name]'?"
- If the user mentions being blocked, always ask: what is blocking you, and is it related to another task?
- If the user mentions progress (e.g. "almost done", "60%", "halfway"), note it — you'll use it in the summary.
- Never invent task names or IDs. Only reference tasks from the list above.
- Never make assumptions about which task the user means if there's ambiguity.
- If the user tries to go off-topic, redirect once: "Let's finish the standup first — we can discuss that after."
- When all three topics are covered, say: "Great, that covers everything! Let me put together your update."
- Do NOT output JSON during the conversation. Only speak naturally.

## Tone
Neutral and professional. Not robotic. Not overly cheerful. Think: smart, respectful colleague.
```

---

## Context Injection — Task Object

The `{{taskContext}}` placeholder is filled at session start. This is what gets injected:

```
The user's assigned tasks (use these to match what they mention):

Task BT0201 | "Meeting AI assistant" | Status: In Progress | Priority: Medium | Due: 2026-02-25
  Subtasks:
    BST0014 | "audio frequency mismatch" | Status: Done
    BST0017 | "Update STT server environment" | Status: In Progress

Task BT0027 | "Canvas panel edits not reflected for other users" | Status: Backlog | Priority: Low | Due: 2025-12-24

Task BT0156 | "Dashboard Redesign" | Status: In Progress | Priority: High | Due: 2026-02-26
  Dependencies: none
  Relations: none
```

**Format rules:**
- Plain text, not JSON (LLMs parse plain text task lists very reliably)
- Include task number + name + status + due date
- Include subtasks indented under parent
- Include existing dependencies and relations (so LLM knows what's already linked)
- Omit tasks with status `Done` unless they were completed in the last 2 days

---

## System Prompt — Extraction Mode

Run this after the conversation is complete, with the full transcript as input:

```
You are a data extraction assistant. Read the standup conversation below and extract structured information.

Return ONLY valid JSON. No explanation. No markdown. No code fences. Just raw JSON.

Extract the following:

{
  "task_updates": [
    // Tasks that need status or progress changes
    // { "_id": task _id, "taskNumber": "BT...", "status": new status, "statusCategory": category, "percentageCompletion": 0-100 }
    // status values: "To Do" | "In Progress" | "Done" | "Blocked" | "Backlog" | "In Review"
    // statusCategory: "not_started" | "in_progress" | "completed"
  ],
  "progress_comments": [
    // { "taskId": task _id, "taskNumber": "BT...", "comment": formatted comment string }
  ],
  "roadblock_comments": [
    // { "taskId": task _id, "taskNumber": "BT...", "comment": formatted comment string, "notifyLead": true/false }
  ],
  "dependencies_to_add": [
    // { "taskId": task _id that has the dependency, "dependsOnTaskId": the blocking task's _id }
  ],
  "relations_to_add": [
    // { "taskId": task _id, "relatedToTaskId": related task _id, "relationType": "relates_to" | "duplicates" }
  ],
  "new_tasks_to_create": [
    // { "name": string, "boardId": same boardId, "workspaceId": same workspaceId, "assigneeEmail": user email, "status": "To Do", "priority": "Medium" }
  ],
  "new_subtasks_to_create": [
    // { "name": string, "parentTaskId": task _id, "boardId": ..., "workspaceId": ..., "assigneeEmail": ..., "status": "To Do", "priority": "Medium" }
  ],
  "notifications_to_send": [
    // { "type": "blocker_notify_lead", "taskId": ..., "taskName": ..., "reason": string }
  ],
  "summary_for_lead": "2-3 sentence plain English summary of this person's standup"
}

Rules:
- Only include items that were actually discussed. Do not invent.
- If no blockers, return empty array for roadblock_comments.
- Use task _id values from the task list provided, not taskNumbers.
- percentageCompletion should be a number 0-100. If user said "almost done" use 85. If "halfway" use 50. If "just started" use 10.
- If a task reference is still ambiguous (the conversation didn't resolve it), do NOT include it.

## Conversation to extract from:
{{conversationTranscript}}

## Task reference list (for _id lookup):
{{taskReferenceJson}}
```

---

## Progress Comment Format

The LLM generates this text for the `comment` field in `progress_comments`:

```
📊 Standup Progress Update — {{date}}
Reported by: {{userName}} via Standup Mediator

Status: {{status}}
Progress: {{progress description from conversation}}
Est. completion: {{if mentioned}}
Next: {{what they're doing today related to this task}}
```

---

## Roadblock Comment Format

```
🚧 Standup Roadblock — {{date}}
Reported by: {{userName}} via Standup Mediator

Status: Blocked
Reason: {{reason from conversation}}
Blocking task: {{linked task if identified, else "External dependency"}}
Team lead notified: Yes
Raised: {{datetime}}
```

---

## Output Schema — Zod Validation

Every LLM extraction output MUST pass this schema before any write-back happens:

```typescript
// src/llm/schemas/standup-output.ts
import { z } from 'zod'

const TaskUpdateSchema = z.object({
  _id: z.string(),
  taskNumber: z.string(),
  status: z.enum(['To Do', 'In Progress', 'Done', 'Blocked', 'Backlog', 'In Review']),
  statusCategory: z.enum(['not_started', 'in_progress', 'completed']),
  percentageCompletion: z.number().min(0).max(100).optional(),
})

const CommentSchema = z.object({
  taskId: z.string(),
  taskNumber: z.string(),
  comment: z.string().min(1),
  notifyLead: z.boolean().optional(),
})

const RelationshipSchema = z.object({
  taskId: z.string(),
  dependsOnTaskId: z.string().optional(),
  relatedToTaskId: z.string().optional(),
  relationType: z.enum(['relates_to', 'duplicates']).optional(),
})

const NewTaskSchema = z.object({
  name: z.string().min(1),
  boardId: z.string(),
  workspaceId: z.string(),
  assigneeEmail: z.string().email(),
  status: z.literal('To Do'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
})

export const StandupOutputSchema = z.object({
  task_updates: z.array(TaskUpdateSchema).default([]),
  progress_comments: z.array(CommentSchema).default([]),
  roadblock_comments: z.array(CommentSchema).default([]),
  dependencies_to_add: z.array(RelationshipSchema).default([]),
  relations_to_add: z.array(RelationshipSchema).default([]),
  new_tasks_to_create: z.array(NewTaskSchema).default([]),
  new_subtasks_to_create: z.array(NewTaskSchema.extend({ parentTaskId: z.string() })).default([]),
  notifications_to_send: z.array(z.object({
    type: z.string(),
    taskId: z.string(),
    taskName: z.string(),
    reason: z.string(),
  })).default([]),
  summary_for_lead: z.string(),
})

export type StandupOutput = z.infer<typeof StandupOutputSchema>
```

**If validation fails:** log the raw LLM output, return error to UI, do not attempt write-back.

---

## Test Fixtures

Every fixture is a JSON file with a mock conversation + expected output. Run each fixture through the LLM during Phase 0 to validate the prompt before development.

Location: `tests/fixtures/`

| Fixture | Tests |
|---------|-------|
| `clean-standup.json` | All 3 topics, clear answers, tasks exist — happy path |
| `vague-update.json` | "Worked on backend stuff" — does LLM ask the right follow-up? |
| `ambiguous-task-match.json` | "The auth stuff" → 2 matching tasks — does LLM offer choices? |
| `blocker-with-dependency.json` | Blocker + "waiting on X task" → dependency link created |
| `new-task-creation.json` | User mentions work not in task list → LLM asks to create |
| `no-update-response.json` | User says nothing happened / skips → no-update marked cleanly |
| `progress-qualitative.json` | "Almost done" → percentageCompletion: 85 |
| `multiple-subtasks.json` | User mentions 2 subtasks done — both captured |
| `off-topic.json` | User goes off-script — LLM redirects once, then continues |
| `relation-detection.json` | "X is related to Y" → relation[] link created |

---

## Prompt Iteration Log

See [PROMPT-DESIGN.md](./PROMPT-DESIGN.md) for the living log of prompt versions and test results.
