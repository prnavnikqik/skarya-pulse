# 02 — System Architecture
## Skarya Pulse — How Everything Connects

---

## Design Principle

**LLM-native. Not infra-heavy.**

There is no custom NLP pipeline. No intent classifier to train. No transcription layer.

The architecture is:
```
User (web app)  →  Mediator Service  →  LLM API  →  skarya.ai Internal APIs
```

The LLM is the brain. skarya.ai APIs are the hands. The Pulse service is the wire between them.

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Browser (Web App)                      │
│                                                          │
│   ┌──────────────────────────────────────────────────┐  │
│   │  Standup Chat UI                                  │  │
│   │  • Message thread (user ↔ Pulse)                  │  │
│   │  • Confirmation Card                              │  │
│   │  • Session status indicator                       │  │
│   └────────────────┬─────────────────────────────────┘  │
└────────────────────│────────────────────────────────────┘
                     │ HTTP (REST)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                Mediator API (Next.js)                    │
│                                                          │
│  POST /api/standup/start        ← start session         │
│  POST /api/standup/message      ← send user message     │
│  POST /api/standup/confirm      ← confirm + write-back  │
│  GET  /api/standup/session/:id  ← get session state     │
│  GET  /api/standup/summary      ← get team summary      │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Session Manager                                 │   │
│  │  • Creates and tracks session state              │   │
│  │  • Stores conversation history in DB             │   │
│  │  • Routes messages to LLM                        │   │
│  └──────────────┬──────────────────────────────────┘   │
│                 │                                        │
│  ┌──────────────▼──────────────────────────────────┐   │
│  │  LLM Orchestration Layer                         │   │
│  │  • Builds system prompt with task context        │   │
│  │  • Sends conversation history to LLM             │   │
│  │  • Receives response                             │   │
│  │  • Detects if conversation is complete           │   │
│  │  • Triggers structured output extraction         │   │
│  └──────────────┬──────────────────────────────────┘   │
│                 │                                        │
│  ┌──────────────▼──────────────────────────────────┐   │
│  │  skarya.ai Integration Layer                     │   │
│  │  • Reads tasks at session start                  │   │
│  │  • Writes confirmed updates after confirm        │   │
│  │  • Sends email notifications                     │   │
│  └──────────────┬──────────────────────────────────┘   │
│                 │                                        │
│  ┌──────────────▼──────────────────────────────────┐   │
│  │  Session Store (DB)                              │   │
│  │  • Persists full session: conversation,          │   │
│  │    LLM output, confirmed output, write status    │   │
│  └─────────────────────────────────────────────────┘   │
└───────────┬─────────────────────────────────────────────┘
            │                          │
            ▼                          ▼
  ┌─────────────────┐       ┌─────────────────────────┐
  │   LLM API       │       │  skarya.ai Backend      │
  │  (Haiku 3.5 /   │       │  (Next.js, same domain) │
  │   GPT-4o-mini)  │       │  /api/boardTask/...     │
  │                 │       │  /api/boardSubtask/...  │
  └─────────────────┘       │  /api/emailNotification │
                            └─────────────────────────┘
```

---

## Request Lifecycle — One Standup Turn

```
1. User types message in chat UI
   → POST /api/standup/message { sessionId, content }

2. Session Manager loads session from DB
   → Gets: workspaceId, boardId, conversationHistory[], taskContext

3. LLM Orchestration builds the prompt
   → system prompt (Pulse persona + rules + task context)
   → full conversationHistory (all prior turns)
   → new user message appended

4. LLM API called
   → Returns: assistant message (follow-up question OR conversational reply)
   → OR: special signal that conversation is complete

5. If conversation NOT complete:
   → Save new turn to DB
   → Return assistant message to UI
   → User sees Pulse's reply, types next message

6. If conversation IS complete:
   → LLM called again with output extraction prompt
   → Returns: structured JSON (task_updates, comments, relationships, etc.)
   → JSON validated against Zod schema
   → Session updated: status = 'completed', llmOutput = JSON
   → Return JSON to UI → UI renders Confirmation Card

7. User reviews Confirmation Card, clicks Confirm
   → POST /api/standup/confirm { sessionId, confirmedOutput }
   → Write-back layer executes API calls in order
   → Session updated: status = 'confirmed', writebackStatus per item
   → Summary generated and saved
   → Return success to UI
```

---

## Data Flow Summary

```
Session Start:
  skarya API  →  task context  →  LLM system prompt

Each turn:
  User message  →  LLM (full history + context)  →  Assistant reply  →  DB

End of conversation:
  LLM (output extraction prompt)  →  structured JSON  →  Zod validation  →  UI

On confirm:
  Confirmed JSON  →  skarya API calls (in order)  →  DB writeback status
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | Same stack as skarya.ai — easy to integrate later |
| Language | TypeScript | Type safety on LLM output is non-negotiable |
| LLM — Primary | Claude Haiku 3.5 (`claude-haiku-3-5-20251001`) | Fast, cheap (~$0.001/session), excellent instruction following |
| LLM — Fallback | GPT-4o-mini | If Anthropic has issues |
| LLM Output Validation | Zod | Parse and validate structured JSON from LLM |
| HTTP Client | Axios | Call skarya.ai internal APIs |
| Session DB | PostgreSQL (Supabase) or SQLite (prototype) | Store sessions with full conversation history |
| Styling | Tailwind CSS | Fast UI development |
| Auth | Piggyback skarya.ai session cookie | User must already be logged into skarya.ai |

---

## LLM Provider Abstraction

The LLM is accessed via a `LLMClient` interface. Swapping providers requires zero business logic changes — only the provider file changes.

```typescript
// src/llm/client.ts
interface LLMClient {
  chat(messages: Message[], options?: ChatOptions): Promise<string>
}

// src/llm/providers/anthropic.ts
class AnthropicClient implements LLMClient { ... }

// src/llm/providers/openai.ts
class OpenAIClient implements LLMClient { ... }

// Which one is used → controlled by env var:
// LLM_PROVIDER=anthropic | openai | gemini
```

---

## skarya.ai API Access

skarya.ai backend is deployed on the **same domain** as the frontend (it's a Next.js monolith or Next.js + API routes on same domain). This means:

- API calls can be made server-side with the user's session cookie
- No CORS issues
- Base URL: `https://skarya.skarya.ai`
- All endpoints prefixed with `/api/`
- Auth: pass user session cookie from incoming request through to skarya API calls

See [03-SKARYA-API-REFERENCE.md](./03-SKARYA-API-REFERENCE.md) for all endpoints.

---

## Key Architecture Decisions & Rationale

| Decision | What We Chose | Why Not Alternative |
|----------|--------------|---------------------|
| Where does LLM run | Server-side only | Never expose API keys to browser |
| Session memory | Full conversation history in DB | In-memory dies on refresh; we need history for analytics |
| Structured output | Separate extraction prompt after conversation ends | Cleaner than trying to get JSON mid-conversation |
| Write-back order | Sequential with error isolation | One failed API call should not block the others |
| Task fetch timing | At session start only (not real-time) | Avoid API hammering during conversation |
| Subtask write | Read → merge → full PUT | skarya subtask endpoint requires full object (confirmed from HAR) |
