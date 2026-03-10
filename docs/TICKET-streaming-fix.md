# Ticket: Fixing "Access to storage is not allowed" / "Missing Context" / Streaming Protocol Errors

## Describe the Bug
The chat interface encountered several silent breaking failures:
1. **Missing Context (Frontend):** After upgrading to `@ai-sdk/react@v3` (AI SDK v6), the `sendMessage` and `append` function signatures drastically changed. The new system failed to append the `workspaceId`, `boardId`, and `userEmail` parameters to the request body, silently failing with a Backend 400 error (`Missing Context`).
2. **Context Window Overflow (Backend):** When the AI successfully triggered `get_user_tasks`, the Skarya API responded with ~470+ KB of raw unpaginated Mongo JSON arrays. Passing this immediately into the Groq Llama 3.3 70B model overflowed its 8K context window and abruptly terminated the data stream pipeline.
3. **Chunked Encoding Timeout (Next.js):** The default Next.js server runtime aborted connections processing large asynchronous tool executions midway through chunked streaming.

## Steps to Reproduce
1. Attempt to send a message on `/pulse` using modern `@ai-sdk/react` without a custom fetch middleware.
2. If context makes it through, prompt the AI to query "What are my tasks?".
3. Watch the Next API route throw `net::ERR_INCOMPLETE_CHUNKED_ENCODING` silently in the network tab.

## Expected Behavior
The AI should be able to trigger `get_user_tasks`, fetch the tasks asynchronously, and respond cleanly with a user-friendly UI component block without breaking the prompt context window.

## Resolution & Fixes Applied
1. **Revert Frontend SDK:** Downgraded `ai` to `v4.1.41` and `@ai-sdk/react` to their stable baseline compatible with UI-rendered tool invocations. Used the native `.append()` functionality to properly merge custom `body` context fields again.
2. **Payload Restructuring:** Reworked `route.ts` to utilize the native `TaskReader.fetchUserTasks()` instead of a raw `axios.get`.
3. **Context Reduction Mapping:** Stripped out the 470KB payload. Hard-mapped the response data to return only: `id`, `title`, `status`, `priority`, and `dueDates`. This reduces incoming tool payload JSON to roughly ~600 bytes.
4. **Enforce Dynamic Server Processing:** Injected `export const dynamic = 'force-dynamic'` and `export const maxDuration = 60` into `route.ts`. This forcibly disables any edge-caching and gives the backend ample time to stream the tool validations back to the client interface.

**Status:** Resolved & Pushed (`prnavnikqik`).
