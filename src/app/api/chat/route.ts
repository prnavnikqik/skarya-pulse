import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongoose';
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
      system: `You are Skarya Pulse, an omniscient AI project manager embedded inside the Skarya suite (currently testing against staging domain karyaa.ai).
Your primary mission is to REPLACE the daily standup meeting and enforce developer accountability.

When interacting with a user:
1. ALWAYS use the 'get_user_tasks' tool first if you do not know their current active tasks.
2. Formally ask them the standup questions: What did they accomplish yesterday? What are they working on today? Any blockers?
3. HOLD THEM ACCOUNTABLE. Compare what they say with the data from 'get_user_tasks'. 
   - If they claim they finished a task but it's not marked Done, offer to update it using 'update_task_status'.
   - If they are working on something not assigned to them, offer to create it using 'create_task'.
4. CRITICAL AUTH RULE: You are STRICTLY FORBIDDEN from modifying or updating tasks that belong to other assignees. You must only update tasks where the user is listed as the assignee.
5. Be professional, concise, and proactive. The goal is to keep the Skarya boards purely up to date without a human project manager.`,
      messages,
      tools: {
        get_user_tasks: tool({
          description: 'Fetch all tasks assigned to the current user in the active board. Call this whenever the user asks about their own tasks, what they should do today, or asks for a summary of their work.',
          parameters: z.object({}),
          execute: async () => {
            const res = await axios.get(`${SKARYA_API_URL}/api/tasks?userEmail=${userEmail}&boardId=${boardId}`, {
              headers: { 'Cookie': `session=${SKARYA_COOKIE}` }
            });
            return { success: true, tasks: res.data.tasks.filter((t: any) => t.assigneeEmail === userEmail) };
          }
        }),

        persist_standup: tool({
          description: 'Once you have gathered the users standup data (what they did yesterday, what they are doing today, and any blockers), call this tool to persist it permanently in the database.',
          parameters: z.object({
            yesterday: z.string().describe('What the user accomplished yesterday.'),
            today: z.string().describe('What the user intends to work on today.'),
            blockers: z.string().describe('Any blockers or issues preventing progress.')
          }),
          execute: async (args) => {
            try {
              await connectToDatabase();
              await Standup.create({
                userEmail: userEmail,
                workspaceId: workspaceId,
                boardId: boardId,
                yesterday: args.yesterday,
                today: args.today,
                blockers: args.blockers
              });
              return { success: true, message: 'Standup successfully recorded in the MongoDB database.' };
            } catch (error: Error | unknown) {
              return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
          }
        }),

        draft_document: tool({
          description: 'Draft a PRD, project plan, update summary, or any other long-form documentation the user requests based on the board context.',
          parameters: z.object({
            title: z.string().describe('The title of the generated document.'),
            content: z.string().describe('The full markdown text content of the document.')
          }),
        }),

        summarize_thread: tool({
          description: 'Summarize a long discussion thread or comment history on a specific task.',
          parameters: z.object({
            taskId: z.string().describe('The ID of the task to summarize.')
          }),
          execute: async (args) => {
            return {
              success: true,
              message: 'Thread mapped successfully.',
              summary: `[Mock API Response] The team discussed issue with API latency. John suggested adding Redis cache. The decision is pending load testing results.`
            };
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
