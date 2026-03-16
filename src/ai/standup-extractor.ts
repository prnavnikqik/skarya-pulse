import { generateObject } from 'ai';
import { z } from 'zod';
import { groq } from '@ai-sdk/groq';
import Standup from '@/models/Standup';
import connectToDatabase from '@/lib/mongoose';

/**
 * Background utility to extract standup data from a chat transcript and persist it.
 * This ensures data is saved even if the user disconnects or the AI doesn't call the tool.
 */
export async function extractAndPersistStandup(
    messages: any[],
    userEmail: string,
    workspaceId: string,
    boardId: string
) {
    try {
        await connectToDatabase();

        // 1. Prepare transcript for extraction
        // We only care about the last ~10-15 messages to extract the latest status
        const transcript = messages.slice(-15).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        if (transcript.length < 50) return; // Not enough context to extract anything meaningful

        console.log(`[Standup-Extractor] Extracting from transcript for ${userEmail}`);

        // 2. Use a fast model to extract structured standup data
        const { object } = await generateObject({
            model: groq('llama-3.1-8b-instant'), // Fast and cheap for extraction
            schema: z.object({
                yesterday: z.string().optional(),
                today: z.string().optional(),
                blockers: z.string().optional(),
                summary: z.string().optional(),
                confidence: z.number().describe('Score 0-1 on how much valid standup data was found')
            }),
            system: `You are a data extractor. Analyze the chat transcript between a User and an AI Assistant. 
            Identify if the user shared their daily standup progress.
            Extract:
            - "yesterday": What they finished.
            - "today": What they plan to do.
            - "blockers": Anything stopping them (None if not mentioned).
            - "summary": A brief executive summary.
            
            Only extract if the user explicitly provided this info. If info is missing, leave the field empty.`,
            prompt: `Transcript:\n${transcript}`
        });

        if (object.confidence < 0.4) {
            console.log(`[Standup-Extractor] Low confidence (${object.confidence}), skipping persist.`);
            return;
        }

        // 3. Upsert to MongoDB
        // We look for a standup from "Today" for this user/board
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const updateData: any = {};
        if (object.yesterday) updateData.yesterday = object.yesterday;
        if (object.today) updateData.today = object.today;
        if (object.blockers) updateData.blockers = object.blockers;
        if (object.summary) updateData.summary = object.summary;

        if (Object.keys(updateData).length === 0) return;

        await Standup.findOneAndUpdate(
            {
                userEmail,
                boardId,
                date: { $gte: today }
            },
            {
                $set: {
                    ...updateData,
                    workspaceId,
                    lastExtractedAt: new Date()
                }
            },
            { upsert: true, new: true }
        );

        console.log(`[Standup-Extractor] Successfully persisted standup for ${userEmail}`);

    } catch (error) {
        console.error(`[Standup-Extractor] Failed:`, error);
    }
}
