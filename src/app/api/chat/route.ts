import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';
import Standup from '@/models/Standup';
import { streamText, tool, StreamData } from 'ai';
import { groq } from '@ai-sdk/groq';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import axios from 'axios';
import { z } from 'zod';

const SKARYA_API_URL = process.env.NEXT_PUBLIC_SKARYA_API_URL || 'https://pulse.karyaa.ai';
const SKARYA_COOKIE = process.env.SKARYA_SESSION_COOKIE;
const PROTOTYPE_USER_NAME = process.env.PROTOTYPE_USER_NAME || 'Pranav Patil';

export async function POST(req: Request) {
  try {
    const { messages, workspaceId, boardId, userEmail, modelId } = await req.json();

    if (!workspaceId || !boardId || !userEmail) {
      return new Response('Missing Context', { status: 400 });
    }

    let selectedModel;
    if (modelId?.startsWith('claude')) {
      selectedModel = anthropic(modelId);
    } else if (modelId?.startsWith('gemini')) {
      selectedModel = google(modelId);
    } else {
      selectedModel = groq(modelId || 'llama-3.3-70b-versatile');
    }

    const data = new StreamData();

    const result = await streamText({
      model: selectedModel,
      system: `You are Skarya Pulse, a helpful AI project manager.`,
      messages,
      tools: {
        get_user_tasks: tool({
          description: 'Fetch tasks.',
          parameters: z.object({}),
          execute: async () => {
            const res = await axios.get(`${SKARYA_API_URL}/api/tasks?userEmail=${userEmail}&boardId=${boardId}`, {
              headers: { 'Cookie': `session=${SKARYA_COOKIE}` }
            });
            return { success: true, tasks: res.data.tasks.filter((t: any) => t.assigneeEmail === userEmail) };
          }
        }),
        persist_standup: tool({
          description: 'Persist standup.',
          parameters: z.object({
            yesterday: z.string(),
            today: z.string(),
            blockers: z.string()
          }),
          execute: async (args) => {
            await connectToDatabase();
            await Standup.create({ userEmail, workspaceId, boardId, ...args });
            return { success: true };
          }
        })
      },
      onFinish: () => data.close(),
      maxSteps: 3,
    });

    return result.toDataStreamResponse({ data });
  } catch (err: any) {
    console.error("AI CHAT ERROR:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
