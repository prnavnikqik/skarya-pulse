# 00 — Overview
## Skarya Pulse — What, Why, Who

---

## What Is the Problem?

Every team runs a daily standup. In theory it's 15 minutes. In practice:

- People give vague updates: *"worked on backend stuff"* — nothing gets logged
- Tasks in skarya.ai are never updated during or after the call
- Managers find out about blockers days late, not in the moment
- Remote/async teams suffer most — timezone differences mean someone always misses context
- The call happens, context dies in the air, the board doesn't reflect reality

**The board is always stale. The manager is always guessing. The team is always in a slightly different mental model of where things are.**

---

## What Are We Building?

A web-based AI Pulse that:

1. **Replaces the standup call** — not assists it. Users interact privately with the bot instead of a group call.
2. **Understands free-form language** — not a form. Users talk naturally, the LLM understands.
3. **Updates skarya.ai automatically** — after user confirmation, the bot writes back to real tasks.
4. **Reports to leadership** — team lead gets a structured summary with risk signals.

This is not a chatbot. It is a structured workflow automation powered by a conversational LLM interface.

---

## The Five Real Pains We're Solving

| # | Pain | How Mediator Solves It |
|---|------|----------------------|
| 1 | People give vague updates | LLM probes for specifics via follow-up questions |
| 2 | Managers don't know real progress | Structured summary delivered after every session |
| 3 | Tasks not updated properly | LLM maps updates to real tasks, user confirms, system writes |
| 4 | Teams forget to log blockers | Blocker detection built into conversation flow |
| 5 | Remote team alignment gaps | Async mode — everyone submits on their own time |

---

## Who Uses This?

### Individual Contributor (IC) — Primary User
- Interacts with the Pulse daily
- Answers questions about their own tasks
- Reviews and confirms the proposed updates
- Gets a private conversation — not exposed to the team unless they allow it

### Team Lead / Engineering Manager — Secondary User
- Receives the daily standup summary
- Sees risk signals: who is blocked, who didn't submit, what's slipping
- Can drill into any member's standup session
- Does NOT interact with the Pulse directly (Phase 0)

### CEO / Exec — Tertiary (Future)
- High-level dashboard view across all teams (Phase 4+)
- Not in scope for prototype

---

## What This Is NOT

| Not This | Why |
|----------|-----|
| A surveillance tool | Mediator helps teams, not monitors them. Neutral corporate tone. |
| A replacement for all communication | It replaces the standup call only |
| A voice bot (yet) | Phase 1 is text-only |
| A Slack/Teams bot (yet) | Phase 1 is standalone web app |
| A rigid form | Questions are conversational, follow-ups are dynamic |

---

## Product Philosophy

> The Pulse should feel like a smart, efficient colleague asking you about your work — not a ticket system interrogating you.

- Tone: **Neutral corporate** — not overly friendly, not robotic
- Confirmation: **Always required** — no silent writes to tasks. Ever.
- Privacy: **Private by default** — user's standup responses are not visible to teammates unless explicitly enabled
- Intelligence: **Level 3 for prototype** — context-aware, knows the user's tasks, asks smart follow-ups
- Redundancy: **Zero tolerance** — no duplicate tasks, no duplicate comments

---

## Prototype vs Full Product

| Aspect | Prototype (now) | Full Product (later) |
|--------|----------------|---------------------|
| Interface | Standalone web app | Inside skarya.ai dashboard |
| Session mode | Async only | Async + Live |
| Trigger | User opens manually | Scheduled + manual |
| Intelligence | Level 3 | Level 4 |
| Channels | Web app only | Web, Slack, Teams, Voice |
| Analytics | Session summary | Full burndown, risk, health |
| Tone | Neutral corporate | Customizable |
| Privacy | Private default | User + lead configurable |
