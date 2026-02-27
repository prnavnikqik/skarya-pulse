# 08 — Prototype Build Plan
## 5-Day Delivery Plan — Solo Developer

> Goal: Working prototype that demonstrates the full standup flow end-to-end.  
> Not perfect. Not production-ready. Demo-ready.

---

## What "Done" Looks Like After 5 Days

- User can open the web app, authenticate with skarya credentials
- Mediator fetches their real tasks from skarya.ai
- LLM runs the conversation (yesterday, today, blockers) with smart follow-ups
- User sees confirmation card with all proposed changes
- On confirm: task statuses and comments are written to real skarya.ai tasks
- Team lead sees a standup summary

That's it. That's the demo.

---

## Day 0 (Today) — Setup & Documentation ✅

**Goal:** Zero ambiguity before writing code. Every decision made. Every file ready.

- [x] Define all product decisions (async, manual trigger, confirm-required, etc.)
- [x] Document skarya.ai API endpoints from HAR
- [x] Design LLM prompts (conversation + extraction)
- [x] Define all data models and types
- [x] Map every edge case
- [x] Plan confirmation UX
- [ ] Confirm skarya.ai API gaps with backend (updateBoardTask, addComment, createTask)
- [ ] Set up repo structure and all config files
- [ ] Set up `.env` with LLM API key + skarya credentials
- [ ] Write first version of system prompt
- [ ] Run prompt v1 against 3 fixtures manually (clean, vague, blocker)

**End of Day 0:** Repo initialized. Docs complete. Prompt tested manually. Zero unknowns.

---

## Day 1 — Backend Foundation

**Goal:** API layer working. Can fetch tasks and call LLM. Session stored in DB.

### Morning
- [ ] Next.js project init with TypeScript + Tailwind
- [ ] DB setup (SQLite for prototype — zero infra)
- [ ] Session model + DB schema (`sessions` table)
- [ ] `skarya-client.ts` — authenticated HTTP wrapper for skarya API
- [ ] `task-reader.ts` — fetch tasks + subtasks for a user

### Afternoon
- [ ] `LLMClient` interface + Anthropic provider implementation
- [ ] `context-builder.ts` — converts task array → plain text context string
- [ ] `session/manager.ts` — create session, save/load conversation history
- [ ] `POST /api/standup/start` — complete endpoint:
  - fetch tasks from skarya
  - build context
  - call LLM (first message)
  - save session to DB
  - return first message

**Test:** Call `/api/standup/start` from curl. Get back a real first message from Kobi. See real task names in the message.

---

## Day 2 — Conversation Loop + Extraction

**Goal:** Full conversation works end-to-end. LLM output JSON is valid.

### Morning
- [ ] `POST /api/standup/message` — complete endpoint:
  - load session + history from DB
  - append user message
  - call LLM (conversation mode)
  - detect completion signal
  - save turn to DB
  - return assistant reply + isComplete flag

### Afternoon
- [ ] `output-extractor.ts` — extraction prompt + parsing
- [ ] Zod schema validation of LLM output
- [ ] Handle validation failure gracefully (log, return error to UI)
- [ ] Completion detection logic (scan for wrap-up phrase + max turns fallback)

**Test:** Full conversation via curl/Postman. Get structured JSON output at the end. Validate it passes Zod schema.

---

## Day 3 — Write-Back Layer + Confirm API

**Goal:** Confirmed changes actually write to skarya.ai.

### Morning
- [ ] `task-writer.ts`:
  - Update task status + percentageCompletion
  - Update dependency[] and relation[] arrays
  - Post task comments (progress + roadblock)
  - Create new tasks
  - Create new subtasks (read-first-then-full-PUT pattern)
  - Send email notifications
- [ ] Error isolation — each write is independent, failure doesn't stop others

### Afternoon
- [ ] `POST /api/standup/confirm` — complete endpoint:
  - validate confirmedOutput against Zod schema
  - execute write-back in order
  - save writebackResults per item to session DB
  - generate + save standup summary
  - return results to UI

**Test:** Full flow via Postman. See actual changes appear in skarya.ai board. Check comments, status, dependencies.

---

## Day 4 — UI

**Goal:** Working web UI. Looks presentable for demo.

### Morning
- [ ] Chat UI — message thread component (user messages + Kobi messages)
- [ ] Session start screen ("Start My Standup" button)
- [ ] Message input + send button
- [ ] Loading states (Kobi is thinking...)
- [ ] Connect to `/api/standup/start` and `/api/standup/message`

### Afternoon
- [ ] Confirmation Card component:
  - Section per change type (status updates, comments, dependencies, new tasks, notifications)
  - Edit inline for each item
  - Remove button per item
  - Confirm & Update button with loading state
  - Per-item success/failure indicators
- [ ] Connect to `/api/standup/confirm`
- [ ] Success screen after confirm

---

## Day 5 — Polish + Team Lead View + Demo Prep

**Goal:** Demo-ready. Edge cases handled. Summary visible.

### Morning
- [ ] Team lead summary view — simple table: member name, status, 1-line summary, blockers
- [ ] `GET /api/standup/summary?boardId=&standupDate=` endpoint
- [ ] Error boundary components (LLM fail, API fail — show friendly error)
- [ ] Handle "No Update" path cleanly

### Afternoon
- [ ] Run through all 10 test fixture scenarios manually in the app
- [ ] Fix any prompt issues found (log in PROMPT-DESIGN.md)
- [ ] Fix any UI bugs
- [ ] Deploy to Vercel (or wherever) for demo access
- [ ] Record a 2-minute demo walkthrough video

---

## What's Explicitly NOT in the 5-Day Build

- User authentication (hardcode a test user email for prototype)
- Scheduled standup triggers
- Slack / Teams integration
- Voice input
- Analytics / trend views
- Multi-board support in one session
- Full error recovery for all edge cases

---

## Daily Check-In Template

At end of each day, note in a `DEVLOG.md`:
```
## Day N — YYYY-MM-DD
### Done
- ...
### Blocked
- ...
### Tomorrow
- ...
### Prompt changes (if any)
- ...
```

---

## Risk Register

| Risk | Likelihood | What To Do |
|------|-----------|-----------|
| skarya.ai updateBoardTask endpoint doesn't exist | Medium | Ask backend to confirm/add on Day 0 |
| LLM produces invalid JSON | Low | Zod catches it. Retry extraction once with stricter prompt. |
| skarya subtask full PUT breaks with missing fields | Medium | Test read-merge-PUT pattern on Day 3 immediately |
| LLM conversation goes too long / loops | Low | Max 20 turns hard cap, force extraction |
| Prototype not demoed in 5 days | Low | Core flow (chat + confirm + write-back) is MVP. Summary view is bonus. |
