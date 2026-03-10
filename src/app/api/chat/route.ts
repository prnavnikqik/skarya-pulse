import { groq } from '@ai-sdk/groq';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

import { analyzeIntent } from '@/ai/intent';
import { buildTokenControlledContext } from '@/ai/context';
import { runAgentEngine } from '@/ai/agent-engine';
import mongoose from 'mongoose';
import ChatSession from '@/models/ChatSession';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI!;
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { messages, workspaceId, boardId, userEmail, modelId, chatId, chatType } = await req.json();

    if (!workspaceId || !boardId || !userEmail) {
      return new Response('Missing Context', { status: 400 });
    }

    // Security: Verify user has access to this board
    const { TaskReader } = await import('@/integrations/task-reader');
    const hasAccess = await TaskReader.verifyBoardAccess(boardId, userEmail);
    if (!hasAccess) {
      return new Response('Unauthorized Board Access', { status: 403 });
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
      historyLimit: 3, // Urgent reduction due to 12k TPM limit
      systemPromptTokensEstimate: 300
    });

    // 4. Agent Engine Layer
    const result = await runAgentEngine(
      selectedModel,
      controlledMessages,
      boardId,
      workspaceId,
      userEmail,
      intentContextStr,
      intentResult.intent,
      chatId,
      messages, // original raw messages
      chatType
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
