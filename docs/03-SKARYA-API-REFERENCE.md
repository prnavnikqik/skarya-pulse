# 03 — skarya.ai API Reference
## Real Endpoints — Confirmed from Live HAR Analysis

> All endpoints are on: `https://skarya.skarya.ai`  
> Auth: forward the user's session cookie on every request  
> Every request must include `workspaceId` and `boardId` in query or body

---

## Data Hierarchy (Confirmed)

```
Account  (accountId: "6683", subdomain: "skarya")
  └── Workspace  (_id: "692ba14ce2552a8b5afe6e9a", name: "Product")
        └── Board  (_id: "694a87f7e6aa80a347e86e5a", boardName: "Dev & Test")
              └── Task  (_id, taskNumber: "BT0201", ...)
                    └── Subtask  (_id, subtaskNumber: "BST0017", ...)
```

---

## READ Endpoints (Confirmed ✅)

---

### GET /api/boards/board
Get a board by ID.

```
GET /api/boards/board?id={boardId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "694a87f7e6aa80a347e86e5a",
    "accountId": "6683",
    "workspaceId": "692ba14ce2552a8b5afe6e9a",
    "subdomain": "skarya",
    "boardName": "Dev & Test",
    "visibility": "Public",
    "owners": ["nikhilchoudhary11@gmail.com"],
    "users": ["email1@...", "email2@...", "..."],
    "userGroups": [],
    "taskCounter": 0,
    "isDefault": false,
    "pinnedBy": ["kakoli.banerjee@nikqik.com"],
    "createdAt": "2025-12-23T12:15:51.850Z"
  }
}
```

**Mediator uses this for:** verifying board access, getting team member list

---

### GET /api/boards/getBoardById&Access
Get board + verify the requesting user has access.

```
GET /api/boards/getBoardById&Access?id={boardId}&email={userEmail}
```

**Response:** Same as `/api/boards/board` but validates user email is in `users[]`

**Mediator uses this for:** Access check before starting session

---

### GET /api/boardTask/getBoardTask
Get all tasks in a board. This is the primary endpoint for loading task context.

```
GET /api/boardTask/getBoardTask?boardId={boardId}&workspaceId={workspaceId}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "694a9c99e6aa80a347e90dab",
      "workspaceId": "692ba14ce2552a8b5afe6e9a",
      "boardId": "694a87f7e6aa80a347e86e5a",
      "taskNumber": "BT0027",
      "name": "Canvas panel edits are not reflected for other users",
      "assigneePrimary": {
        "email": "kakoli.banerjee@nikqik.com",
        "name": "Kakoli Banerjee"
      },
      "assigneeGroup": null,
      "percentageCompletion": 0,
      "startDate": "2025-12-23T13:42:43.251Z",
      "dueDate": "2025-12-24T13:42:43.251Z",
      "priority": "Low",
      "type": "Enhancement",
      "createdBy": "dipeeka.wagh@nikqik.com",
      "status": "Backlog",
      "statusCategory": "not_started",
      "dependency": [],
      "relation": [],
      "collaborators": [],
      "dailyPlannerStartDate": null,
      "dailyPlannerDueDate": null
    }
  ]
}
```

**Key fields for mediator:**
- `_id` — internal task ID used for all writes
- `taskNumber` — human-readable (BT0201) — use for display
- `name` — used for fuzzy matching when user mentions a task
- `status` — current status
- `statusCategory` — `not_started` | `in_progress` | `completed`
- `percentageCompletion` — already exists, mediator can update this
- `dependency[]` — array of dependent task IDs — already exists on model ✅
- `relation[]` — array of related task IDs — already exists on model ✅
- `assigneePrimary.email` — filter by this to get the logged-in user's tasks
- `collaborators[]` — also include these tasks in user's context

**Mediator uses this for:** Loading user's task context at session start  
**Filter:** Only include tasks where `assigneePrimary.email === userEmail` OR `collaborators` contains user

---

### GET /api/boardTask/getFilteredAssignee
Get tasks filtered by assignee. Cleaner than filtering clientside.

```
GET /api/boardTask/getFilteredAssignee?boardId={boardId}&workspaceId={workspaceId}
```

**Response:** Same structure as `getBoardTask` — returns all tasks with full assignee objects populated

**Mediator uses this for:** Alternative to getBoardTask for user-specific task fetch

---

### GET /api/boardTask/getTaskInitData
Get a single task with fully populated workspace and board objects.

```
GET /api/boardTask/getTaskInitData?workspaceId={workspaceId}&boardId={boardId}&taskId={taskId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "task": {
      "_id": "697998ed41661976907ad88b",
      "workspaceId": { "_id": "...", "name": "Product" },
      "boardId": { "_id": "...", "boardName": "Dev & Test" },
      "taskNumber": "BT0201",
      "name": "Meeting AI assistant",
      "assigneePrimary": { "email": "pranav.patil@nikqik.com", "name": "Pranav Patil" },
      "percentageCompletion": 0,
      "startDate": "2026-01-28T05:03:31.614Z",
      "dueDate": "2026-02-25T05:03:31.614Z",
      "dailyPlannerStartDate": "2026-02-25T10:17:16.084Z",
      "dailyPlannerDueDate": "2026-02-25T11:17:16.084Z",
      "priority": "Medium",
      "type": "Task",
      "status": "In Progress",
      "dependency": [],
      "relation": []
    }
  }
}
```

**Mediator uses this for:** Fetching full task detail before a subtask full-object PUT

---

### GET /api/boardSubtask/getBoardSubtask
Get all subtasks under a task.

```
GET /api/boardSubtask/getBoardSubtask?boardId={boardId}&taskId={taskId}&workspaceId={workspaceId}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6996c34a291f16edd6e7c64a",
      "workspaceId": "692ba14ce2552a8b5afe6e9a",
      "boardId": "694a87f7e6aa80a347e86e5a",
      "taskId": "697998ed41661976907ad88b",
      "subtaskNumber": "BST0014",
      "name": "audio frequency mismatch",
      "assignee": { "email": "pranav.patil@nikqik.com", "name": "Pranav Patil" },
      "startDate": "2026-02-19T08:01:14.689Z",
      "dueDate": "2026-02-20T08:01:14.689Z",
      "priority": "High",
      "status": "Done",
      "createdBy": "pranav.patil@nikqik.com",
      "checklist": [],
      "description": "Teams audio is usually 48kHz.\nWhisper expects 16kHz mono",
      "__v": 0
    }
  ]
}
```

**Mediator uses this for:** Loading subtask context per task, fetching full object before PUT

---

### GET /api/boardTaskComment/getBoardTaskComment
Get comments on a task (paginated).

```
GET /api/boardTaskComment/getBoardTaskComment?boardId={boardId}&taskId={taskId}&workspaceId={workspaceId}&skip=0&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "_id": "699ec9da291f16edd6e8b279",
        "user": "pranav.patil@nikqik.com",
        "userName": "Pranav Patil",
        "text": "websockets was implemented for live streaming and proper flow",
        "timestamp": "2026-02-25T10:07:22.767Z"
      }
    ]
  }
}
```

**Mediator uses this for:** Checking if a standup comment was already posted today (avoid duplicates)

---

### GET /api/boardSubtaskComment/getBoardSubtaskComment
Get comments on a subtask.

```
GET /api/boardSubtaskComment/getBoardSubtaskComment?boardId={boardId}&taskId={taskId}&subtaskId={subtaskId}&workspaceId={workspaceId}
```

**Important:** Returns `{ "success": false, "message": "Comments not found" }` when no comments exist. This is not an error — handle it as an empty result, do not throw.

---

### GET /api/boards/getFilterBoard
Get filtered board task view.

```
GET /api/boards/getFilterBoard?boardId={boardId}&workspaceId={workspaceId}
```

---

## WRITE Endpoints

---

### ✅ PUT /api/boardSubtask/updateBoardSubtask — CONFIRMED
Update a subtask. **CRITICAL: Requires full object, not partial patch.**

```
PUT /api/boardSubtask/updateBoardSubtask?id={subtaskId}
```

**Full body required (confirmed from HAR):**
```json
{
  "assignee": { "email": "pranav.patil@nikqik.com", "name": "Pranav Patil" },
  "_id": "699bc2cb291f16edd6e81fc2",
  "workspaceId": "692ba14ce2552a8b5afe6e9a",
  "boardId": "694a87f7e6aa80a347e86e5a",
  "taskId": "697998ed41661976907ad88b",
  "subtaskNumber": "BST0017",
  "name": "Update STT server environment & requirements",
  "startDate": "2026-02-23T03:00:29.131Z",
  "dueDate": "2026-02-24T03:00:29.131Z",
  "priority": "Medium",
  "status": "Done",
  "createdBy": "pranav.patil@nikqik.com",
  "checklist": [],
  "__v": 0
}
```

**⚠️ Implementation rule:** Always GET the subtask first, then merge your changes, then PUT the full merged object. Never PUT only changed fields.

---

### ✅ POST /api/emailNotification/boardEmail — CONFIRMED
Trigger an email notification. Multiple methods supported.

```
POST /api/emailNotification/boardEmail
```

**Body (subtask update example — confirmed from HAR):**
```json
{
  "method": "subtask-update-parentAssignee",
  "boardName": "Dev & Test",
  "assignee": "pranav.patil@nikqik.com",
  "parentTaskAssigneeName": "Pranav Patil",
  "taskName": "Meeting AI assistant",
  "taskNumber": "BT0201",
  "subtaskNumber": "BST0017",
  "subtaskName": "Update STT server environment & requirements",
  "workspaceName": "Product",
  "subdomainName": "skarya",
  "accountId": "6683",
  "userEmail": "pranav.patil@nikqik.com"
}
```

**Known methods (from HAR):**
- `subtask-update-parentAssignee` — notify parent task assignee when subtask is updated
- `subtask-assigneeTask-update` — notify subtask assignee when their task changes

**Method needed for mediator (to confirm/add):**
- `task-blocked-notify-lead` — notify team lead when a task is blocked

---

### ✅ POST /api/role-permission — CONFIRMED
Check if a role has permission for an action.

```
POST /api/role-permission
Body: { "roleId": "692ba14ce2552a8b5afe6e93" }
```

---

## INFERRED Endpoints (Pattern-Based — Confirm Before Using)

These follow the same naming convention as confirmed endpoints. High confidence they exist, but must be verified with the skarya.ai backend team before development.

| Method | Endpoint | Notes |
|--------|----------|-------|
| `PATCH` or `PUT` | `/api/boardTask/updateBoardTask?id={taskId}` | Update task status, percentageCompletion, dependency[], relation[]. Confirm if partial PATCH or full PUT required. |
| `POST` | `/api/boardTaskComment/addBoardTaskComment` | Post a comment on a task. Body likely: `{ boardId, taskId, workspaceId, text, user, userName }` |
| `POST` | `/api/boardSubtaskComment/addBoardSubtaskComment` | Post comment on subtask. Same pattern. |
| `POST` | `/api/boardTask/createBoardTask` | Create a new task. Required fields TBD — follow existing task model. |
| `POST` | `/api/boardSubtask/createBoardSubtask` | Create a new subtask under a task. Required: `taskId`, `boardId`, `workspaceId`, `name`, `assignee`, `status`, `priority`. |

---

## NEW Endpoint — Needs to Be Built

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/standup/saveStandupSummary` | Save the standup summary for the team lead dashboard. This is the only genuinely new endpoint needed. |

**Suggested request body:**
```json
{
  "workspaceId": "...",
  "boardId": "...",
  "standupDate": "2026-02-26",
  "sessionIds": ["uuid1", "uuid2"],
  "memberSummaries": [
    {
      "userEmail": "alex@team.com",
      "userName": "Alex Chen",
      "status": "submitted",
      "submittedAt": "2026-02-26T09:04:00Z",
      "summary": "Completed Login Bug Fix. Dashboard Redesign 60% — blocked on design specs.",
      "tasksCompleted": ["BT0142"],
      "tasksInProgress": ["BT0156"],
      "blockers": [{ "taskId": "BT0156", "reason": "Waiting on design specs" }]
    },
    {
      "userEmail": "priya@team.com",
      "userName": "Priya S",
      "status": "pending",
      "declaredSubmissionTime": "15:00",
      "summary": null
    }
  ],
  "riskSignals": [
    { "type": "blocked", "taskId": "BT0156", "daysSinceBlocked": 1 },
    { "type": "overdue", "taskId": "BT0027", "daysOverdue": 3 }
  ]
}
```

---

## Required Query Parameters Cheatsheet

| Parameter | Where Required | Example |
|-----------|---------------|---------|
| `workspaceId` | All board/task/subtask calls | `692ba14ce2552a8b5afe6e9a` |
| `boardId` | All task/subtask calls | `694a87f7e6aa80a347e86e5a` |
| `taskId` | All subtask calls | `697998ed41661976907ad88b` |
| `subtaskId` | Subtask comment calls | `699bc2cb291f16edd6e81fc2` |
| `email` | Board access check | `pranav.patil@nikqik.com` |
| `id` | Board/task/subtask by ID | `694a87f7e6aa80a347e86e5a` |

---

## Phase 0 — API Confirmation Checklist

Before any write-back code is written, confirm these with the skarya backend:

- [ ] `PATCH /api/boardTask/updateBoardTask` — exact method (PATCH or PUT?), full body or partial?
- [ ] Does `dependency[]` accept task `_id` strings or task objects?
- [ ] Does `relation[]` accept task `_id` strings or task objects?
- [ ] `POST /api/boardTaskComment/addBoardTaskComment` — confirm it exists, get body schema
- [ ] `POST /api/boardTask/createBoardTask` — confirm it exists, get required fields
- [ ] `POST /api/boardSubtask/createBoardSubtask` — confirm it exists
- [ ] `emailNotification/boardEmail` — what methods can we add for blocker notifications?
- [ ] Build `POST /api/standup/saveStandupSummary`
