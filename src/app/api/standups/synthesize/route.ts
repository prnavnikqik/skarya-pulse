import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Standup from '@/models/Standup';
import TeamStandup from '@/models/TeamStandup';
import { generateObject } from 'ai';
import { z } from 'zod';
import { groq } from '@ai-sdk/groq';

export const dynamic = 'force-dynamic';

/**
 * API Route: Aggregates all individual standups for the day into a single TeamStandup.
 * Triggered on-demand or via dashboard.
 */
export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const { workspaceId, boardId } = await req.json();

        if (!workspaceId || !boardId) {
            return NextResponse.json({ error: 'Missing Context' }, { status: 400 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateString = today.toISOString().split('T')[0];

        // 1. Fetch all individual standups for today
        const standups = await Standup.find({
            workspaceId,
            boardId,
            date: { $gte: today }
        }).lean();

        if (standups.length === 0) {
            return NextResponse.json({ success: true, message: 'No standups found to synthesize yet.' });
        }

        // 2. Prepare narrative for LLM
        const standupNarrative = standups.map(s => {
            return `USER: ${s.userEmail}\n- Yesterday: ${s.yesterday}\n- Today: ${s.today}\n- Blockers: ${s.blockers}`;
        }).join('\n\n---\n\n');

        // 3. Generate synthesized team summary
        const { object } = await generateObject({
            model: groq('llama-3.3-70b-versatile'),
            schema: z.object({
                metrics: z.string().describe('e.g. "5 members updated · 2 blockers identified"'),
                tags: z.array(z.object({
                    label: z.string(),
                    colorClass: z.string()
                })),
                summaryHtml: z.string().describe('Rich HTML summary of the team\'s day'),
                hasCriticalBlockers: z.boolean()
            }),
            system: `You are the Skarya Pulse Mediator. Your job is to take raw daily standups from a team and synthesize them into a high-level executive summary for the dashboard.
            
            Focus on:
            - Progress: What major things are landing?
            - Velocity: Is the team moving fast?
            - Risks: Highlight any blockers clearly.
            
            Use clean HTML for the summaryHtml (use <b>, <p>, <ul>, <li>). Do not use <html> or <body> tags.`,
            prompt: `Sync Narrative for ${dateString}:\n\n${standupNarrative}`
        });

        // 4. Upsert TeamStandup
        const updates = standups.map(s => ({
            userEmail: s.userEmail,
            userName: s.userEmail.split('@')[0], // Fallback if name not in record
            timestamp: s.createdAt,
            type: 'general',
            synopsis: s.summary || 'Daily check-in',
            hasBlockers: s.blockers.toLowerCase() !== 'none'
        }));

        const teamSync = await TeamStandup.findOneAndUpdate(
            { workspaceId, boardId, dateString },
            {
                $set: {
                    updates,
                    summary: {
                        lastGeneratedAt: new Date(),
                        metrics: object.metrics,
                        tags: object.tags,
                        contentHtml: object.summaryHtml
                    },
                    unreadNotifications: object.hasCriticalBlockers ? standups.length : 0
                }
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, data: teamSync });

    } catch (error: any) {
        console.error('[Synthesis API] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
