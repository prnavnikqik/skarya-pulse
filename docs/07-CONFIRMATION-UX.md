# 07 — Confirmation UX
## Confirmation Card Design — Exact Behavior

---

## Why Confirmation Is Mandatory

No changes are written to skarya.ai until the user explicitly confirms.  
This is non-negotiable. No exceptions. Not even for the manager.

Why:
- LLM can misidentify tasks — user catches this before it's written
- Creates trust — user is always in control of what gets updated
- Enables editing — user can correct the AI before confirming
- Audit trail — what the LLM proposed vs. what the user confirmed is both stored

---

## Confirmation Card Layout

```
┌───────────────────────────────────────────────────────────┐
│  ✅ Your Standup Summary — 26 Feb 2026                    │
│  Review the changes below before we update your board.    │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  STATUS UPDATES                                           │
│  ─────────────────────────────────────────────────────   │
│  ✅  BT0142 — Login Bug Fix          In Progress → Done  │  [Edit]
│  🔄  BT0156 — Dashboard Redesign     Status: In Progress │  [Edit]
│              Progress: 60%                               │
│                                                           │
│  COMMENTS TO POST                                         │
│  ─────────────────────────────────────────────────────   │
│  💬  BT0156 — Progress comment                           │  [View] [Edit]
│      "📊 Standup Progress Update — 26 Feb 2026..."       │
│                                                           │
│  🚧  BT0156 — Roadblock comment                          │  [View] [Edit]
│      "🚧 Standup Roadblock — 26 Feb 2026..."             │
│                                                           │
│  DEPENDENCIES                                             │
│  ─────────────────────────────────────────────────────   │
│  🔗  BT0156 depends on BT0089 — Design Specs Dashboard   │  [Edit]
│                                                           │
│  NEW TASKS                                               │
│  ─────────────────────────────────────────────────────   │
│  🆕  PR Review — API Changes                             │  [Edit] [Remove]
│      Assigned: You  |  Priority: Medium  |  Status: To Do│
│      Subtask of: BT0120 API v2 Migration                 │
│                                                           │
│  NOTIFICATIONS                                           │
│  ─────────────────────────────────────────────────────   │
│  🔔  Jordan Lee will be notified about the blocker       │  [Remove]
│      on BT0156                                           │
│                                                           │
├───────────────────────────────────────────────────────────┤
│             [ Cancel ]    [ Confirm & Update → ]          │
└───────────────────────────────────────────────────────────┘
```

---

## Editing Behavior

Every line item on the confirmation card has actions:

| Action | What It Does |
|--------|-------------|
| **[Edit]** | Opens an inline edit panel for that specific item |
| **[View]** | Expands the full comment text (collapsed by default) |
| **[Remove]** | Removes that item from the confirmedOutput — it will NOT be written |

### Editable Fields Per Item Type

**Status Update:**
- Status dropdown (To Do / In Progress / Done / Blocked / In Review / Backlog)
- percentageCompletion slider (0–100)

**Comment (Progress or Roadblock):**
- Free text edit of the comment body
- Toggle: include / exclude from write-back

**Dependency:**
- Change the "depends on" task (searchable dropdown from task list)
- Remove the dependency

**New Task:**
- Name (text)
- Priority (dropdown)
- Assignee (dropdown from board members)
- Remove entirely

**Notification:**
- Remove (don't send this notification)

---

## Confirm & Update Behavior

On click:
1. Button shows loading spinner — text changes to "Updating..."
2. API calls execute in order (see 05-SESSION-FLOW.md write-back order)
3. Each item shows status in real-time:
   - Pending → ⏳
   - Success → ✅
   - Failed → ❌ (with error message)
4. When all done → show success screen

**If some items fail:**
- Show partial success message: "3 of 4 updates applied. 1 failed."
- List what failed and why
- User can retry failed items individually
- Do NOT roll back successful items

---

## Cancel Behavior

- Session status set to `cancelled`
- Nothing written to skarya.ai
- Conversation history preserved in DB
- User sees: "Update cancelled. Your standup conversation has been saved but no changes were applied to your board."

---

## Success Screen

After confirmation:
```
┌───────────────────────────────────────────────┐
│  🎉 Standup Complete!                         │
│                                               │
│  ✅  2 task statuses updated                  │
│  ✅  2 comments posted                        │
│  ✅  1 dependency linked                      │
│  ✅  1 new task created                       │
│  ✅  Team lead notified                       │
│                                               │
│  Your summary has been sent to Jordan Lee.    │
│                                               │
│  [View Updated Board]    [Done]               │
└───────────────────────────────────────────────┘
```

"View Updated Board" → deep link to skarya.ai board page.
