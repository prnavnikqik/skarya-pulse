# 🎙️ Standup Mediator
### A skarya.ai Feature — LLM-Powered Daily Standup Automation

> **Current Phase:** Phase 0 — Setup, Planning & Documentation  
> **Prototype Deadline:** 5 days from kickoff  
> **Team:** 1 developer  
> **Status:** 🟡 In Progress

---

## What Is This?

Standup Mediator replaces the daily standup call.

Instead of a team hopping on a call every morning, the mediator — powered by an LLM — privately messages each team member, asks them what they worked on, what they're doing today, and if they're blocked. It understands their free-form answers, updates tasks in skarya.ai automatically, and delivers a structured summary to the team lead.

**The three real pains it solves:**
1. People give vague updates in standups — nothing gets tracked
2. Managers don't know real progress until it's too late
3. Tasks never get updated properly after the meeting

---

## Prototype Scope (5 Days)

| In Scope | Out of Scope |
|----------|-------------|
| Web app (standalone prototype) | skarya.ai full integration |
| Async session per user | Live/synchronous session orchestration |
| Text-only interaction | Voice, Slack, Teams |
| LLM-powered conversation (Level 3) | Proactive risk alerts (Level 4) |
| Manual trigger by user | Scheduled/automatic trigger |
| skarya.ai API read/write via existing endpoints | New backend endpoints (except standup summary) |
| Per-session storage | Cross-session analytics |

---

## How It Works (Prototype Flow)

```
1. User opens Standup Mediator web app
2. User clicks "Start My Standup"
3. System fetches their assigned tasks from skarya.ai API
4. LLM starts conversation — asks about yesterday, today, blockers
5. LLM asks smart follow-ups if answers are vague or ambiguous
6. LLM matches mentioned work to real tasks (fuzzy match → clarify → create if new)
7. LLM produces structured JSON: status updates, progress %, comments, dependencies
8. User sees Confirmation Card — reviews all proposed changes
9. User confirms → changes written to skarya.ai via API
10. Team lead gets standup summary
```

---

## Repository Structure

```
standup-mediator/
│
├── README.md                        ← you are here
├── .env.example                     ← required env vars
├── .gitignore
├── package.json
│
├── docs/                            ← all planning & design docs
│   ├── 00-OVERVIEW.md               ← what, why, who
│   ├── 01-PRODUCT-REQUIREMENTS.md   ← full PRD
│   ├── 02-SYSTEM-ARCHITECTURE.md    ← how components connect
│   ├── 03-SKARYA-API-REFERENCE.md   ← real endpoints from HAR
│   ├── 04-LLM-DESIGN.md             ← prompt strategy, schema, fixtures
│   ├── 05-SESSION-FLOW.md           ← exact conversation flow + edge cases
│   ├── 06-DATA-MODELS.md            ← all data structures
│   ├── 07-CONFIRMATION-UX.md        ← confirmation card design
│   ├── 08-PROTOTYPE-PLAN.md         ← 5-day build plan
│   └── PROMPT-DESIGN.md             ← living prompt iteration log
│
├── src/
│   ├── llm/
│   │   ├── client.ts                ← provider-agnostic LLM interface
│   │   ├── providers/
│   │   │   ├── anthropic.ts
│   │   │   ├── openai.ts
│   │   │   └── gemini.ts
│   │   ├── prompts/
│   │   │   ├── system.ts            ← master system prompt
│   │   │   ├── context-builder.ts   ← builds context from skarya data
│   │   │   └── output-extractor.ts  ← prompts LLM to produce final JSON
│   │   └── schemas/
│   │       └── standup-output.ts    ← Zod schema for LLM output
│   │
│   ├── session/
│   │   ├── manager.ts               ← session lifecycle
│   │   └── store.ts                 ← session storage (DB)
│   │
│   ├── integrations/
│   │   ├── skarya-client.ts         ← authenticated HTTP client
│   │   ├── task-reader.ts           ← fetch user tasks + subtasks
│   │   └── task-writer.ts           ← write confirmed updates back
│   │
│   ├── confirmation/
│   │   └── builder.ts               ← build confirmation card from LLM output
│   │
│   └── types/
│       └── index.ts                 ← all shared TypeScript types
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/                    ← sample standup conversations for prompt testing
│       ├── clean-standup.json
│       ├── vague-update.json
│       ├── ambiguous-task-match.json
│       ├── blocker-with-dependency.json
│       ├── new-task-creation.json
│       └── no-update-response.json
│
└── scripts/
    └── test-prompt.ts               ← run a fixture through the LLM, see output
```

---

## Docs Index

| File | What It Covers |
|------|----------------|
| [00-OVERVIEW](./docs/00-OVERVIEW.md) | Product vision, problems solved, users |
| [01-PRODUCT-REQUIREMENTS](./docs/01-PRODUCT-REQUIREMENTS.md) | Full requirements, functional + non-functional |
| [02-SYSTEM-ARCHITECTURE](./docs/02-SYSTEM-ARCHITECTURE.md) | Component diagram, data flow, tech decisions |
| [03-SKARYA-API-REFERENCE](./docs/03-SKARYA-API-REFERENCE.md) | Every real endpoint, request/response, gap analysis |
| [04-LLM-DESIGN](./docs/04-LLM-DESIGN.md) | Prompt strategy, context injection, output schema |
| [05-SESSION-FLOW](./docs/05-SESSION-FLOW.md) | Full conversation flow, all edge cases |
| [06-DATA-MODELS](./docs/06-DATA-MODELS.md) | All TypeScript types and data structures |
| [07-CONFIRMATION-UX](./docs/07-CONFIRMATION-UX.md) | Confirmation card design, edit flow |
| [08-PROTOTYPE-PLAN](./docs/08-PROTOTYPE-PLAN.md) | Day-by-day 5-day build plan |
| [PROMPT-DESIGN](./docs/PROMPT-DESIGN.md) | Living log of prompt versions and test results |

---

## Quick Start (Once Dev Begins)

```bash
git clone <repo>
cd standup-mediator
cp .env.example .env
# fill in your LLM API key and skarya.ai credentials
npm install
npm run dev
```

---

## Tech Stack (Prototype)

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js (App Router) | skarya is already Next.js — same ecosystem |
| Language | TypeScript | Type safety on LLM output is critical |
| LLM | Claude Haiku 3.5 (primary) | Cheap, fast, great instruction following |
| LLM Schema validation | Zod | Validate LLM JSON output before writing |
| HTTP client | Axios | Call skarya.ai internal APIs |
| Session storage | PostgreSQL or SQLite | Store standup sessions with full history |
| UI | Tailwind CSS | Fast styling |

---

*skarya.ai internal project — Confidential*
