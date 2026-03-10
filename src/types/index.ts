// src/types/index.ts
// All shared TypeScript types for Standup Mediator
// See docs/06-DATA-MODELS.md for full documentation of each type

// ─── skarya.ai API Types (matches real API response shapes) ───────────────

export interface SkaryaTask {
  _id: string
  workspaceId: string
  boardId: string
  taskNumber: string
  name: string
  assigneePrimary: { email: string; name: string }
  assigneeGroup: null | string
  percentageCompletion: number
  startDate: string
  dueDate: string
  dailyPlannerStartDate: string | null
  dailyPlannerDueDate: string | null
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  type: string
  createdBy: string
  status: string
  statusCategory: 'not_started' | 'in_progress' | 'completed'
  dependency: string[]
  relation: string[]
  collaborators: string[]
}

export interface SkaryaSubtask {
  _id: string
  workspaceId: string
  boardId: string
  taskId: string
  subtaskNumber: string
  name: string
  assignee: { email: string; name: string }
  startDate: string
  dueDate: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  status: string
  createdBy: string
  checklist: any[]
  description: string
  __v: number
}

export interface SkaryaComment {
  _id: string
  user: string
  userName: string
  text: string
  timestamp: string
}

// Task with its subtasks pre-fetched (used in session context)
export interface TaskWithSubtasks extends SkaryaTask {
  subtasks: SkaryaSubtask[]
}

// ─── LLM Output Types ─────────────────────────────────────────────────────

export interface StandupOutput {
  task_updates: TaskUpdate[]
  progress_comments: TaskComment[]
  roadblock_comments: TaskComment[]
  dependencies_to_add: DependencyLink[]
  relations_to_add: RelationLink[]
  new_tasks_to_create: NewTask[]
  new_subtasks_to_create: NewSubtask[]
  notifications_to_send: Notification[]
  summary_for_lead: string
}

export interface TaskUpdate {
  _id: string
  taskNumber: string
  status: string
  statusCategory: 'not_started' | 'in_progress' | 'completed'
  percentageCompletion?: number
}

export interface TaskComment {
  taskId: string
  taskNumber: string
  comment: string
  notifyLead?: boolean
}

export interface DependencyLink {
  taskId: string
  dependsOnTaskId: string
}

export interface RelationLink {
  taskId: string
  relatedToTaskId: string
  relationType: 'relates_to' | 'duplicates'
}

export interface NewTask {
  name: string
  boardId: string
  workspaceId: string
  assigneeEmail: string
  status: 'To Do'
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  createdBy: string
}

export interface NewSubtask extends NewTask {
  parentTaskId: string
}

export interface Notification {
  type: string
  taskId: string
  taskName: string
  reason: string
}

// ─── Session Types ────────────────────────────────────────────────────────

export type SessionStatus = 'created' | 'in_progress' | 'completed' | 'confirmed' | 'cancelled'

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface WritebackResult {
  operation: string
  status: 'success' | 'failed' | 'skipped'
  error?: string
}

export interface StandupSession {
  id: string
  userId: string
  userName: string
  workspaceId: string
  boardId: string
  standupDate: string
  status: SessionStatus
  conversationHistory: ConversationMessage[]
  taskContextSnapshot: TaskWithSubtasks[]
  llmOutput: StandupOutput | null
  confirmedOutput: StandupOutput | null
  writebackResults: WritebackResult[]
  createdAt: string
  updatedAt: string
  completedAt: string | null
  confirmedAt: string | null
}

// ─── Summary Types ────────────────────────────────────────────────────────

export interface MemberSummary {
  userEmail: string
  userName: string
  status: 'submitted' | 'pending' | 'no_update'
  submittedAt: string | null
  declaredSubmissionTime: string | null
  summary: string | null
  tasksCompleted: string[]
  tasksInProgress: string[]
  blockers: Array<{ taskId: string; taskName: string; reason: string }>
}

export interface RiskSignal {
  type: 'blocked' | 'overdue' | 'no_update_streak' | 'long_running_blocker'
  taskId?: string
  userEmail?: string
  detail: string
  severity: 'low' | 'medium' | 'high'
}

export interface StandupSummary {
  id: string
  workspaceId: string
  boardId: string
  standupDate: string
  sessionIds: string[]
  generatedAt: string
  memberSummaries: MemberSummary[]
  riskSignals: RiskSignal[]
}

// ─── API Request / Response Types ─────────────────────────────────────────

export interface StartSessionRequest {
  workspaceId: string
  boardId: string
}

export interface StartSessionResponse {
  sessionId: string
  firstMessage: string
  taskCount: number
}

export interface SendMessageRequest {
  sessionId: string
  content: string
}

export interface SendMessageResponse {
  message: string
  isComplete: boolean
  llmOutput?: StandupOutput
}

export interface ConfirmRequest {
  sessionId: string
  confirmedOutput: StandupOutput
}

export interface ConfirmResponse {
  success: boolean
  writebackResults: WritebackResult[]
  failedCount: number
}
