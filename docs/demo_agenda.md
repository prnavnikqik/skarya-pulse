the **demo scope fully clear**. Let me summarize everything precisely and make a **clean, actionable demo flow** for us. I’ll also make the **state/objects map** so there’s zero ambiguity before coding.

---

# 🎯 Skarya Pulse — Prototype Demo Flow (Confirmed)

**Entry Point:** Web app, test user (no auth for now).

---

## 1️⃣ Start Standup

* User clicks **“Start My Standup”**.
* System creates a **temporary StandupSession** in memory (can later persist to SQLite if needed).
* Session object minimal fields:

  ```ts
  type StandupSession = {
    userEmail: string
    tasks: Task[]
    conversationHistory: ConversationTurn[]
    currentStage: 'yesterday' | 'today' | 'blockers' | 'completed'
    sessionId: string
  }
  ```

---

## 2️⃣ Fetch Tasks

* `skarya-client` fetches **real tasks assigned to the user**.
* Include subtasks if any.
* Tasks injected into **LLM context** for conversation.

---

## 3️⃣ LLM Conversation Loop

* **Flow:**

  1. Ask **Yesterday** → get user input → append to session history
  2. Ask **Today** → get user input → append to session history
  3. Ask **Blockers** → get user input → append to session history

* **Rules:**

  * 1 follow-up allowed if input is vague
  * LLM never outputs JSON mid-conversation
  * Completion signal: `"Great, that covers everything! Let me put together your update."`

* Session keeps **all turns in memory** for demo.

---

## 4️⃣ Extraction & Confirmation

* After conversation, run **LLM extraction** to produce JSON:

  ```ts
  {
    taskUpdates: [...],
    progressComments: [...],
    roadblockComments: [...],
    dependenciesToAdd: [...],
    relationsToAdd: [...],
    newTasksToCreate: [...],
    notificationsToSend: [...],
    summaryForLead: string
  }
  ```
* Show **Confirmation Card**:

  * Task updates (status, progress)
  * Comments (progress + blockers)
  * Dependencies / new tasks if any
  * **Confirm & Update** button

---

## 5️⃣ Write-Back to Skarya

* On confirm, `task-writer.ts` updates **real skarya tasks**:

  * Update task status, percentageCompletion
  * Add comments for progress and blockers
  * Create new tasks / subtasks if needed
* **All operations are independent** — one failure does not block others.
* Save final **standup summary** for lead.

---

## 6️⃣ Team Lead Summary

* Simple table:
  | Member | Yesterday | Today | Blockers |
* Populated from final extracted JSON.
* Read-only, demo-only.

---

## 7️⃣ Error Handling (Demo Scope)

* Basic handling for:

  * LLM fails → show “Pulse is having trouble, try again”
  * API fails → show “Cannot update tasks, try later”
  * Empty input → prompt again
* **No complex retries or logging** for prototype.

---

## 8️⃣ Memory / Session Persistence

* **Prototype:** keep session **in memory** per user.
* Could later swap to **SQLite** if needed, but not required for demo.
* All conversation + LLM output stored **temporarily**, lost on refresh — acceptable for demo.

---

here’s a **clean demo flow diagram** for the Skarya Pulse prototype.  

---

## 🎯 Skarya Pulse — Prototype Flow Diagram

```
[User Opens Web App]
           |
           v
[Click "Start My Standup"]
           |
           v
[Create Temporary Session in Memory]
           |
           v
[Fetch User Tasks from skarya.ai]
           |
           v
[Inject Tasks into LLM Context]
           |
           v
+-----------------------------+
|  LLM Conversation Loop      |
|-----------------------------|
| Stage: YESTERDAY            |
|  -> Ask user what they did  |
|  -> Append to session       |
|  -> Follow-up if vague      |
| Stage: TODAY                |
|  -> Ask user what they're   |
|     doing                   |
|  -> Append to session       |
|  -> Follow-up if vague      |
| Stage: BLOCKERS             |
|  -> Ask user about blockers |
|  -> Append to session       |
|  -> Follow-up if vague      |
| Completion Signal:          |
| "Great, that covers..."     |
+-----------------------------+
           |
           v
[Run Extraction LLM → JSON Output]
           |
           v
[Show Confirmation Card to User]
  - Task Updates
  - Progress Comments
  - Blockers
  - Dependencies / Relations
  - New Tasks (if any)
           |
           v
[User Confirms → Write-Back to skarya.ai]
  - Update task status
  - Add comments
  - Create tasks/subtasks
  - Send notifications (optional)
           |
           v
[Generate Lead Summary Table]
           |
           v
[Display Lead Summary → Demo Complete]
```

---

### 💡 Session & Objects (Prototype)

```ts
type StandupSession = {
  sessionId: string
  userEmail: string
  tasks: Task[]                  // fetched from skarya.ai
  conversationHistory: ConversationTurn[]
  currentStage: 'yesterday' | 'today' | 'blockers' | 'completed'
}

type ConversationTurn = {
  role: 'assistant' | 'user'
  content: string
  timestamp: number
}

type Task = {
  _id: string
  taskNumber: string
  name: string
  status: string
  priority?: string
  subtasks?: Subtask[]
}

type Subtask = {
  subtaskNumber: string
  name: string
  status: string
}
```

---

✅ **Key Notes for Demo Focus**

* Everything is **per-session**, temporary memory OK
* LLM never outputs JSON mid-conversation
* Only one follow-up per vague answer
* Confirmation card shows all proposed changes, **editable in-line optional**
* Write-back is **independent per task**

---
