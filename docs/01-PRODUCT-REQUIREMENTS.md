# 01 — Product Requirements
## Standup Mediator — Full PRD v0.3

---

## 1. Core Decisions (Locked)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Session mode | **Async only** (prototype) | Live orchestration adds unnecessary complexity for v0 |
| Trigger | **User opens manually** | No scheduling logic needed in prototype |
| Confirmation | **Mandatory for every user** | No silent writes. Manager cannot bypass. |
| Session storage | **Persist every session to DB** | Standup history becomes intelligence later |
| Follow-up depth | **Max 1 follow-up per ambiguity** | Avoid conversation loops. Calibrate later. |
| Task matching logic | **Match → Clarify → Create** (see §4) | Zero redundancy, zero duplicate tasks |
| Privacy default | **Private (1-on-1 with mediator)** | User's responses not visible to team by default |
| Tone | **Neutral corporate** | Friendly but efficient. Not robotic, not casual. |
| Intelligence level | **Level 3** (context-aware, knows user's tasks) | Level 4 (proactive alerts) is Phase 2 |
| Text vs Voice | **Text only** | Voice is Phase 2 |

---

## 2. Functional Requirements

### FR-001 — Session Start
- User opens the Standup Mediator web app
- User must be authenticated (via skarya.ai session/token)
- User clicks "Start My Standup"
- System fetches all tasks where user is `assigneePrimary` or in `collaborators[]` from skarya.ai
- System fetches subtasks for each task
- System passes task context to LLM
- LLM begins the conversation

### FR-002 — Conversation Flow
- LLM asks about **yesterday**, **today**, and **blockers** — in that order
- LLM must NOT ask all 3 questions at once — one topic at a time
- LLM asks **dynamic follow-up questions** when:
  - Answer is vague ("worked on backend stuff")
  - Task reference is ambiguous (matches multiple tasks)
  - A blocker is mentioned but no context given
  - Progress is mentioned but no estimate given
- Maximum **1 follow-up question per ambiguity** — do not loop the user
- LLM must stay on-topic — if user goes off-script, redirect politely once

### FR-003 — Task Matching Logic
Given a user's free-form reference to a task, the mediator MUST:

1. **Search** tasks where user is assignee or collaborator, match by name similarity
2. **If 1 clear match found** → proceed with it, confirm inline ("I found 'Login Bug Fix' — is that what you mean?")
3. **If 2–3 similar matches found** → show options, ask user to pick
4. **If no match found** → ask "This doesn't match any existing task — should I create a new one called X?"
5. **Never create a task silently** — always ask first
6. **Never create a duplicate** — before creating, check if a similar task exists (by name fuzzy match)

### FR-004 — Progress Capture
- When user mentions progress (any of: %, qualitative like "almost done", time estimate)
- Mediator captures: progress description, estimated completion signal
- LLM formats into a structured **progress comment** to be posted on the task
- `percentageCompletion` field on task updated if user gives a number

### FR-005 — Roadblock Capture
- When user mentions being blocked (keywords: "waiting", "stuck", "blocked", "can't proceed", "need X from Y", "depends on")
- Mediator captures: reason, what/who is blocking, urgency signal
- LLM formats into a structured **roadblock comment** on the task
- Task status updated to `Blocked`
- If blocking entity is another task → create `dependency[]` link
- Notification sent to team lead via `emailNotification/boardEmail`
- If blocker is due to another team member → tag that person's task as a dependency

### FR-006 — Dependency & Relationship Capture
Mediator detects and creates links using skarya.ai's existing `dependency[]` and `relation[]` arrays on the task model:

| User Says | Detected As | Written To |
|-----------|------------|------------|
| "can't finish X until Y is done" | dependency | `task.dependency[]` |
| "X is blocking the whole auth flow" | blocks | `task.dependency[]` (reverse) |
| "X is related to what Priya is working on" | relation | `task.relation[]` |
| "X is basically the same issue as Y" | relation (duplicate) | `task.relation[]` |
| "X is part of the bigger migration task" | subtask_of | create subtask under parent |

**Rule: If mediator is unsure about which task a relationship points to → ask 1 clarifying question before creating the link.**

### FR-007 — Subtask Handling
- If user mentions a subtask: find it by name under the parent task
- If found → update its status via `PUT /api/boardSubtask/updateBoardSubtask`
- Note: subtask PUT requires **full object** (read first, merge, then write)
- If user mentions creating a new subtask → confirm name and parent task, then create

### FR-008 — Confirmation Step
- After conversation ends, mediator shows user a **Confirmation Card**
- Card lists EVERY proposed change: status updates, comments, new tasks, dependencies, notifications
- User must explicitly click **Confirm & Update** before anything is written
- User can click **Edit** on any line item to modify it before confirming
- No partial confirms — all or nothing (or user edits then confirms)
- If user cancels → nothing is written. Session is saved as "cancelled" in DB.

### FR-009 — skarya.ai Write-Back (on confirm)
On user confirmation, system executes in this order:
1. Update task statuses (`PATCH boardTask`)
2. Update `percentageCompletion` if changed
3. Update `dependency[]` and `relation[]` arrays if changed
4. Post progress comments (`POST boardTaskComment`)
5. Post roadblock comments (`POST boardTaskComment`)
6. Create new tasks if any (`POST boardTask`)
7. Create new subtasks if any (`POST boardSubtask`)
8. Send notifications (`POST emailNotification/boardEmail`)
9. Save standup summary (`POST /api/standup/saveStandupSummary` — new endpoint)

### FR-010 — Team Lead Summary
After all member sessions are processed (or at end of standup window):
- Generate a structured summary per board/workspace
- Summary includes:
  - Each member's update (1–2 sentences)
  - Tasks completed
  - Tasks in progress + progress %
  - Blockers (with dependency links)
  - Members who have NOT submitted yet (with their declared submission time if given)
  - Risk signals (overdue tasks, long-running blockers)
- Delivered to team lead via skarya.ai dashboard

### FR-011 — Non-Submission Handling
- If a member hasn't submitted by end of standup window:
  - Mark their status in summary as "No Update Submitted"
  - If member said they'd submit at a specific time → note that in the summary
  - Do NOT penalize or send aggressive reminders (prototype)
  - Mark as "No Update" automatically if window closes

### FR-012 — Session Storage
Every session must store:
- `sessionId` (UUID)
- `userId` (skarya user email)
- `workspaceId`
- `boardId`
- `standupDate`
- `status`: `in_progress` | `completed` | `confirmed` | `cancelled`
- `conversationHistory`: full array of `{ role: 'user' | 'assistant', content: string }`
- `llmOutput`: the structured JSON the LLM produced
- `confirmedOutput`: what the user actually confirmed (may differ if they edited)
- `writebackStatus`: success/failure per item
- `createdAt`, `updatedAt`

---

## 3. Non-Functional Requirements

### NFR-001 — Performance
- Session start (task fetch + LLM first message) < 4 seconds
- Each LLM turn response < 3 seconds
- Write-back (all API calls after confirm) < 6 seconds total

### NFR-002 — Reliability
- If skarya.ai API call fails during write-back → retry once, then mark that item as "failed" in session. Do NOT stop the rest of the write-back.
- If LLM API fails → show error, preserve session state, allow retry

### NFR-003 — Zero Duplicate Tasks
- Before creating any new task, system fuzzy-matches against existing tasks in the board
- If match confidence > 80% → ask user to confirm it's not a duplicate
- Never create without explicit user confirmation

### NFR-004 — Data Scoping
- Every API call scoped with `workspaceId` + `boardId`
- No data from one workspace accessible in another
- User can only update tasks where they are `assigneePrimary` or in `collaborators[]`

### NFR-005 — Session Privacy
- Standup conversation content is private between user and mediator by default
- Team lead sees only the structured summary output, not the raw conversation
- Raw conversation visible to team lead only if user explicitly enables it (not in prototype)

---

## 4. Out of Scope for Prototype

- Scheduled / automatic standup triggers
- Slack or Teams integration
- Voice input
- Cross-team / cross-workspace analytics
- Proactive risk alerts (Level 4)
- Customizable tone / persona
- Penalty or escalation for missed standups
- Calendar integration (Outlook OAuth exists in skarya but not used by mediator yet)
- Jira / Linear / Asana sync
