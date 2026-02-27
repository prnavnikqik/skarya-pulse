import { NextResponse } from 'next/server';
import { SessionManager } from '@/session/manager';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { workspaceId, boardId, userEmail, userName } = body;

        if (!workspaceId || !boardId || !userEmail || !userName) {
            return NextResponse.json(
                { error: 'Missing required fields: workspaceId, boardId, userEmail, userName' },
                { status: 400 }
            );
        }

        // Call the SessionManager to handle everything
        const sessionData = await SessionManager.startSession(
            workspaceId,
            boardId,
            userEmail,
            userName
        );

        return NextResponse.json({
            success: true,
            data: sessionData
        });
    } catch (error: any) {
        console.error('[API /api/standup/start] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
