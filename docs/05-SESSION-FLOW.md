# 05 — Session Flow
## Exact Conversation Flow + Every Edge Case

---

## Session Lifecycle States

```
created → in_progress → completed → confirmed
                    ↘              ↗
                     cancelled
```

| State | Meaning |
|-------|---------|
| `created` | Session record exists in DB, task context fetched, LLM not started yet |
| `in_progress` | Active conversation — user is typing, LLM is responding |
| `completed` | LLM has finished the conversation and produced structured output. Waiting for user to confirm. |
| `confirmed` | User confirmed. Write-back has been executed. Session is done. |
| `cancelled` | User closed or cancelled before confirming. No writes. Session preserved for history. |

---

## Main Conversation Flow

```
USER OPENS APP
    │
    ▼
AUTHENTICATE
  User must be logged into skarya.ai
  Mediator reads their session cookie
  Verifies access: GET /api/boards/getBoardById&Access?id={boardId}&email={email}
    │
    ▼
SESSION START
  POST /api/standup/start
  → Fetch user tasks: GET /api/boardTask/getFilteredAssignee?boardId=&workspaceId=
  → Fetch subtasks per task: GET /api/boardSubtask/getBoardSubtask per task
  → Build task context string (plain text, injected into system prompt)
  → Create session record in DB: status = 'created'
  → LLM sends first message (greeting + first question)
  → Session status → 'in_progress'
    │
    ▼
CONVERSATION LOOP
  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │   User types message                                │
  │       ↓                                             │
  │   POST /api/standup/message { sessionId, content }  │
  │       ↓                                             │
  │   Session manager loads history from DB             │
  │       ↓                                             │
  │   LLM called (Conversation Mode):                   │
  │     - system prompt + task context                  │
  │     - full conversation history                     │
  │     - new user message                              │
  │       ↓                                             │
  │   LLM returns assistant message                     │
  │       ↓                                             │
  │   Save turn to DB                                   │
  │       ↓                                             │
  │   Return assistant message to UI                    │
  │       ↓                                             │
  │   Is conversation complete?                         │
  │   (LLM output includes signal or max turns reached) │
  │     → NO → wait for next user message               │
  │     → YES → break loop                              │
  │                                                     │
  └─────────────────────────────────────────────────────┘
    │
    ▼
EXTRACTION
  LLM called (Extraction Mode):
    - extraction system prompt
    - full conversation transcript
    - task reference JSON (for _id lookups)
  LLM returns structured JSON
  JSON validated against Zod schema
  If validation fails → error state, show user, do not proceed
  Session updated: status = 'completed', llmOutput = validated JSON
    │
    ▼
CONFIRMATION CARD
  UI renders Confirmation Card from llmOutput
  User reviews all proposed changes
  User can click Edit on any item
  User clicks "Confirm & Update" or "Cancel"
    │
    ├─── CANCEL → session status = 'cancelled', nothing written
    │
    └─── CONFIRM
           ↓
        POST /api/standup/confirm { sessionId, confirmedOutput }
           ↓
        WRITE-BACK (in order — see below)
           ↓
        Session updated: status = 'confirmed', writebackStatus per item
           ↓
        Summary generated and saved
           ↓
        UI shows success screen
```

---

## Write-Back Execution Order

On confirm, execute in this exact order. Each step is independent — if one fails, continue the rest and mark that item as `failed` in session.

```
1. Update task statuses + percentageCompletion
   → PATCH /api/boardTask/updateBoardTask per changed task

2. Update dependency[] and relation[] arrays on tasks
   → PATCH /api/boardTask/updateBoardTask (include dependency/relation in body)

3. Post progress comments on tasks
   → POST /api/boardTaskComment/addBoardTaskComment per comment

4. Post roadblock comments on tasks
   → POST /api/boardTaskComment/addBoardTaskComment per roadblock

5. Create new tasks (if any)
   → POST /api/boardTask/createBoardTask

6. Create new subtasks (if any)
   → Read parent task first (GET getTaskInitData)
   → POST /api/boardSubtask/createBoardSubtask

7. Send email notifications (blockers to team lead)
   → POST /api/emailNotification/boardEmail

8. Save standup summary
   → POST /api/standup/saveStandupSummary
```

---

## Edge Case Handling

### Edge Case 1 — Vague Update
```
User: "Did some backend work yesterday"

→ Mediator: "Got it — can you be more specific? Which task were you working on?
             Is it one of these?
             • BT0201 Meeting AI assistant (In Progress)
             • BT0027 Canvas panel edits (Backlog)
             Or was it something else?"

→ Follow-up limit: MAX 1 follow-up per topic
→ If still vague after follow-up: log as vague, do not force task assignment
```

### Edge Case 2 — Ambiguous Task Match
```
User: "Finished the auth stuff"
System finds: BT0142 "Login Bug Fix" AND BT0148 "Auth Unit Tests"

→ Mediator: "Nice! I found two tasks that might match:
             1. BT0142 — Login Bug Fix (In Progress)
             2. BT0148 — Auth Unit Tests (To Do)
             Which one did you finish?"

→ User picks one → proceed
→ If user says "both" → mark both as Done
→ Never guess which one without asking
```

### Edge Case 3 — Task Not Found
```
User: "Finished the payment gateway integration"
System: no match in user's task list

→ Mediator: "I don't see a task for payment gateway integration in your board.
             Should I create a new task called 'Payment Gateway Integration'?
             Or is it called something different in skarya?"

→ If user confirms name → add to new_tasks_to_create in output
→ Before creating: server-side fuzzy match check to confirm no duplicate
```

### Edge Case 4 — Blocker Without Linked Task
```
User: "I'm blocked because the design team hasn't sent specs"

→ Mediator: "Sorry to hear that! Is there a specific task for the design specs,
             or is this a dependency outside the board?"

→ If task exists → create dependency link
→ If external → log roadblock comment only, no dependency link
→ Notify lead either way
```

### Edge Case 5 — Blocker With Linked Task
```
User: "I'm waiting on Priya to finish the API schema before I can continue"
System finds: BT0089 "API Schema Design" assigned to priya@team.com

→ Mediator: "Got it — I'll flag your task as Blocked and link it as depending on
             BT0089 'API Schema Design'. I'll also notify the team lead.
             Does that sound right?"

→ User confirms → dependency[] link created + lead notified
```

### Edge Case 6 — User Has No Updates
```
User: "Nothing to report today" / "I was on leave" / "No blockers" / "Skip"

→ Mediator still asks all 3 topics briefly
→ If user explicitly says nothing for all three:
   "No problem! I'll mark today as a no-update. Take care."
→ Session output: all arrays empty, summary = "No update submitted."
→ Status in team summary: "No Update"
→ Do NOT force the user to give an update
```

### Edge Case 7 — User Mentions Future Task
```
User: "I'll start on the mobile login screen tomorrow"
System: task exists but is assigned to someone else

→ Mediator: "I see 'Mobile Login Screen' (BT0299) is currently assigned to Rahul.
             Are you taking over this task, or just collaborating on it?"

→ Based on answer: reassign OR add as collaborator (surface to confirmation card)
```

### Edge Case 8 — Multiple Blockers
```
User: "I have two blockers actually — waiting on design specs AND the API is down"

→ Mediator processes both:
   1. Design specs blocker → captures reason, asks if there's a linked task
   2. API down → captures reason, asks if it's a known task or external

→ Both appear as separate roadblock_comments in output
→ Both shown on confirmation card
```

### Edge Case 9 — Off-Topic Message
```
User: "Hey can you book a meeting for me?"

→ Mediator: "I can only help with your standup updates right now — let's finish this
             first! You mentioned working on [last topic]..."

→ Redirect ONCE only. If user continues off-topic: log note, continue standup.
```

### Edge Case 10 — User Edits on Confirmation Card
```
User clicks Edit on a task update:
  "Change 'In Progress' to 'Done' instead"

→ Confirmation card updates that line item
→ confirmedOutput reflects the edited value
→ Write-back uses confirmedOutput (not llmOutput)
→ Both llmOutput and confirmedOutput stored in session DB for audit trail
```

---

## Conversation Completion Detection

The LLM signals conversation completion when it says the final wrap-up line:
`"Great, that covers everything! Let me put together your update."`

Server-side: scan the last assistant message for this phrase.
If found → trigger Extraction Mode.

**Backup:** Max turn limit. If conversation exceeds 20 turns without completion signal → force extraction with whatever was discussed. Log as incomplete.

---

## Team Lead Summary Logic

After each member submits:
- Their session summary is appended to the board's standup record for that day

At the end of the standup window (or on demand):
- Team lead sees a single summary card per board with:
  - Member rows: name, status (submitted/pending/no-update), 1-line summary
  - Blocker list: task, reason, who's blocked
  - Pending members: "Priya — said will submit at 3:00 PM"
  - Risk flags: overdue tasks, long-running blockers, members with 3+ days no update
