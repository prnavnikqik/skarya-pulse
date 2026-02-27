# 06 — Data Models
## All TypeScript Types and DB Schemas

---

## skarya.ai Data Types (Read from API)

```typescript
// src/types/index.ts

// Matches skarya.ai boardTask response exactly
export interface SkaryaTask {
  _id: string
  workspaceId: string
  boardId: string
  taskNumber: string           // e.g. "BT0201"
  name: string
  assigneePrimary: {
    email: string
    name: string
  }
  assigneeGroup: null | string
  percentageCompletion: number // 0–100 — field confirmed to exist
  startDate: string            // ISO string
  dueDate: string              // ISO string
  dailyPlannerStartDate: string | null
  dailyPlannerDueDate: string | null
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  type: string                 // "Task" | "Enhancement" | etc.
  createdBy: string            // email
  status: string               // "To Do" | "In Progress" | "Done" | "Blocked" | "Backlog" | "In Review"
  statusCategory: 'not_started' | 'in_progress' | 'completed'
  dependency: string[]         // array of task _ids — confirmed to exist on model
  relation: string[]           // array of task _ids — confirmed to exist on model
  collaborators: string[]
}

// Matches skarya.ai boardSubtask response exactly
export interface SkaryaSubtask {
  _id: string
  workspaceId: string
  boardId: string
  taskId: string               // parent task _id
  subtaskNumber: string        // e.g. "BST0017"
  name: string
  assignee: {
    email: string
    name: string
  }
  startDate: string
  dueDate: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  status: string
  createdBy: string
  checklist: any[]
  description: string
  __v: number
}

// Matches skarya.ai boardTaskComment response
export interface SkaryaComment {
  _id: string
  user: string                 // email
  userName: string
  text: string
  timestamp: string            // ISO string
}
```

---

## Standup Session Model (Stored in DB)

```typescript
export interface StandupSession {
  // Identity
  id: string                   // UUID — primary key
  userId: string               // skarya user email
  userName: string
  workspaceId: string
  boardId: string
  standupDate: string          // "YYYY-MM-DD"

  // State
  status: 'created' | 'in_progress' | 'completed' | 'confirmed' | 'cancelled'

  // Conversation
  conversationHistory: ConversationMessage[]

  // Task context that was injected at session start (snapshot)
  taskContextSnapshot: SkaryaTask[]

  // LLM outputs
  llmOutput: StandupOutput | null        // raw LLM extraction output
  confirmedOutput: StandupOutput | null  // what user actually confirmed (may differ if edited)

  // Write-back results
  writebackResults: WritebackResult[]

  // Timestamps
  createdAt: string
  updatedAt: string
  completedAt: string | null
  confirmedAt: string | null
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface WritebackResult {
  operation: string            // e.g. "update_task_BT0201", "post_comment_BT0156"
  status: 'success' | 'failed' | 'skipped'
  error?: string
}
```

---

## LLM Structured Output Type

```typescript
// src/llm/schemas/standup-output.ts
// (Zod schema defined in 04-LLM-DESIGN.md)

export interface StandupOutput {
  task_updates: Array<{
    _id: string
    taskNumber: string
    status: string
    statusCategory: 'not_started' | 'in_progress' | 'completed'
    percentageCompletion?: number
  }>
  progress_comments: Array<{
    taskId: string
    taskNumber: string
    comment: string
  }>
  roadblock_comments: Array<{
    taskId: string
    taskNumber: string
    comment: string
    notifyLead?: boolean
  }>
  dependencies_to_add: Array<{
    taskId: string
    dependsOnTaskId: string
  }>
  relations_to_add: Array<{
    taskId: string
    relatedToTaskId: string
    relationType: 'relates_to' | 'duplicates'
  }>
  new_tasks_to_create: Array<{
    name: string
    boardId: string
    workspaceId: string
    assigneeEmail: string
    status: 'To Do'
    priority: 'Low' | 'Medium' | 'High' | 'Critical'
  }>
  new_subtasks_to_create: Array<{
    name: string
    parentTaskId: string
    boardId: string
    workspaceId: string
    assigneeEmail: string
    status: 'To Do'
    priority: 'Low' | 'Medium' | 'High' | 'Critical'
  }>
  notifications_to_send: Array<{
    type: string
    taskId: string
    taskName: string
    reason: string
  }>
  summary_for_lead: string
}
```

---

## Standup Summary Model (Saved to DB + skarya)

```typescript
export interface StandupSummary {
  id: string
  workspaceId: string
  boardId: string
  standupDate: string          // "YYYY-MM-DD"
  sessionIds: string[]         // all session IDs included in this summary
  generatedAt: string

  memberSummaries: MemberSummary[]
  riskSignals: RiskSignal[]
}

export interface MemberSummary {
  userEmail: string
  userName: string
  status: 'submitted' | 'pending' | 'no_update'
  submittedAt: string | null
  declaredSubmissionTime: string | null   // if user said "I'll submit at 3pm"
  summary: string | null                  // 1–2 sentence summary for lead
  tasksCompleted: string[]                // task _ids
  tasksInProgress: string[]
  blockers: Array<{
    taskId: string
    taskName: string
    reason: string
  }>
}

export interface RiskSignal {
  type: 'blocked' | 'overdue' | 'no_update_streak' | 'long_running_blocker'
  taskId?: string
  userEmail?: string
  detail: string                          // human-readable description
  severity: 'low' | 'medium' | 'high'
}
```

---

## Mediator API Request/Response Types

```typescript
// POST /api/standup/start
export interface StartSessionRequest {
  workspaceId: string
  boardId: string
}
export interface StartSessionResponse {
  sessionId: string
  firstMessage: string         // Kobi's greeting/first question
  taskCount: number            // how many tasks were loaded
}

// POST /api/standup/message
export interface SendMessageRequest {
  sessionId: string
  content: string
}
export interface SendMessageResponse {
  message: string              // Kobi's reply
  isComplete: boolean          // true = conversation done, show confirmation card next
  llmOutput?: StandupOutput    // only present when isComplete = true
}

// POST /api/standup/confirm
export interface ConfirmRequest {
  sessionId: string
  confirmedOutput: StandupOutput  // may differ from llmOutput if user edited items
}
export interface ConfirmResponse {
  success: boolean
  writebackResults: WritebackResult[]
  failedCount: number
}

// GET /api/standup/summary?boardId=&standupDate=
export interface SummaryResponse {
  summary: StandupSummary
}
```
