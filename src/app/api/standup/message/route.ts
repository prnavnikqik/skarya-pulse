import { NextResponse } from 'next/server';
import { SessionManager } from '@/session/manager';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sessionId, content } = body;

        if (!sessionId || !content) {
            return NextResponse.json(
                { error: 'Missing required fields: sessionId, content' },
                { status: 400 }
            );
        }

        const result = await SessionManager.processUserMessage(sessionId, content);

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('[API /api/standup/message] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
