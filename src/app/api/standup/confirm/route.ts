import { NextResponse } from 'next/server';
import { SessionManager } from '@/session/manager';
import { TaskWriter } from '@/integrations/task-writer';
import { StandupSession } from '@/models/StandupSession';
import connectToDatabase from '@/lib/mongoose';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sessionId, confirmedOutput } = body;

        if (!sessionId || !confirmedOutput) {
            return NextResponse.json(
                { error: 'Missing required fields: sessionId, confirmedOutput' },
                { status: 400 }
            );
        }

        await connectToDatabase();
        const sessionDoc = await StandupSession.findById(sessionId);

        if (!sessionDoc) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        if (sessionDoc.status === 'confirmed') {
            return NextResponse.json({ error: 'Session already confirmed' }, { status: 400 });
        }

        // 1. Execute Write-back
        const writebackResults = await TaskWriter.applyUpdates(confirmedOutput);

        // 2. Tally failures / successes
        const failedCount = writebackResults.filter(r => r.status === 'failed').length;

        // 3. Update session
        sessionDoc.confirmedOutput = confirmedOutput;
        sessionDoc.writebackResults = writebackResults;
        sessionDoc.status = 'confirmed';
        sessionDoc.confirmedAt = new Date().toISOString();

        await sessionDoc.save();

        return NextResponse.json({
            success: true,
            data: {
                success: true,
                writebackResults,
                failedCount
            }
        });
    } catch (error: any) {
        console.error('[API /api/standup/confirm] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
