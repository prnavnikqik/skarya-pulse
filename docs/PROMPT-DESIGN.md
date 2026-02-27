# PROMPT-DESIGN.md
## Living Prompt Iteration Log

> Every time the system prompt or extraction prompt changes, log it here.  
> Include: what changed, why, and what test result it fixed or improved.  
> This is your "model training" equivalent. Don't skip it.

---

## How to Add an Entry

```
## vX.X — YYYY-MM-DD
### What Changed
- ...
### Why
- ...
### Test Results
| Fixture | Before | After |
|---------|--------|-------|
| clean-standup | ✅ | ✅ |
| vague-update | ❌ | ✅ |
### Issues Remaining
- ...
```

---

## v0.1 — 2026-02-26 (Initial Draft)

### What Changed
- First version of conversation system prompt
- First version of extraction prompt
- Both defined in `docs/04-LLM-DESIGN.md`

### Decisions Made in v0.1
- Two-phase LLM approach (conversation → extraction) to avoid JSON mid-conversation
- Plain text task context (not JSON) injected into system prompt
- Max 1 follow-up per ambiguity
- Completion signal: "Great, that covers everything! Let me put together your update."

### Test Results
*Not yet run — run on Day 0 before development begins*

| Fixture | Result | Notes |
|---------|--------|-------|
| clean-standup.json | ⏳ pending | |
| vague-update.json | ⏳ pending | |
| ambiguous-task-match.json | ⏳ pending | |
| blocker-with-dependency.json | ⏳ pending | |
| new-task-creation.json | ⏳ pending | |
| no-update-response.json | ⏳ pending | |

### Issues to Watch
- Will LLM follow the "one question at a time" rule reliably?
- Will extraction correctly map task names to `_id` values using the reference JSON?
- Will percentageCompletion inference (e.g. "almost done" → 85) be consistent?

---

*Add new entries below as prompts are iterated.*
