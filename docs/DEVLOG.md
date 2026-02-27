# DEVLOG.md
## Daily Development Log

> Log what you did, what's blocked, what's next — every day.  
> Keep it short. This is for you, not for presentation.

---

## Day 0 — 2026-02-26

### Done
- All product decisions locked (see 01-PRODUCT-REQUIREMENTS.md)
- Full docs folder created (00 through 08 + PROMPT-DESIGN.md)
- Real skarya.ai API endpoints confirmed from HAR analysis
- All data models and TypeScript types defined
- All edge cases mapped (10 scenarios in 05-SESSION-FLOW.md)
- Test fixtures created for 5 scenarios
- Repo scaffold: package.json, .env.example, .gitignore, scripts/test-prompt.ts

### Blocked
- Need backend to confirm: updateBoardTask endpoint, addBoardTaskComment, createBoardTask
- Need skarya session cookie for prototype auth (or token strategy decision)

### Tomorrow (Day 1)
- Next.js project init
- SQLite DB + session model
- skarya-client.ts + task-reader.ts
- POST /api/standup/start (full endpoint)
- LLM client (Anthropic provider)

### Prompt changes
- v0.1 defined — not yet tested against fixtures
- Run `npm run test:fixtures -- clean-standup` first thing Day 1
