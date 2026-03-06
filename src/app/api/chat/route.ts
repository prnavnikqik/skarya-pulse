import { groq } from '@ai-sdk/groq';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

import { analyzeIntent } from '@/ai/intent';
import { buildTokenControlledContext } from '@/ai/context';
import { runAgentEngine } from '@/ai/agent-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, workspaceId, boardId, userEmail, modelId } = await req.json();

    if (!workspaceId || !boardId || !userEmail) {
      return new Response('Missing Context', { status: 400 });
    }

    // 1. Initialize Models
    let selectedModel;
    if (modelId?.startsWith('claude')) {
      selectedModel = anthropic(modelId);
    } else if (modelId?.startsWith('gemini')) {
      selectedModel = google(modelId);
    } else {
      selectedModel = groq(modelId || 'llama-3.3-70b-versatile');
    }

    // Use a fast model for intent parsing if using groq, else use selected model
    // Fast model saves money & latency
    const intentModel = modelId?.startsWith('claude') || modelId?.startsWith('gemini')
      ? selectedModel
      : groq('llama-3.1-8b-instant');

    // 2. Intent Layer
    const userMessage = messages[messages.length - 1]?.content || '';
    const intentResult = await analyzeIntent(intentModel, messages, userMessage);

    let intentContextStr = `The user's core intent is: ${intentResult.intent}.`;
    if (intentResult.intent === 'search_tasks' && intentResult.searchQuery) {
      intentContextStr += ` They are explicitly searching for: "${intentResult.searchQuery}".`;
    }

    // 3. Context Builder Layer
    // We enforce a strict max budget to prevent the token limit burst
    const controlledMessages = buildTokenControlledContext(messages, {
      historyLimit: 8,
      systemPromptTokensEstimate: 500
    });

    // 4. Agent Engine Layer
    const result = await runAgentEngine(
      selectedModel,
      controlledMessages,
      boardId,
      workspaceId,
      userEmail,
      intentContextStr
    );

    // 5. Stream Output
    return result.toDataStreamResponse({
      getErrorMessage: (error: any) => {
        console.error("STREAM CRASH ERROR:", error);
        return error instanceof Error ? error.message : String(error);
      }
    });

  } catch (err: any) {
    console.error("AI CHAT ERROR:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
