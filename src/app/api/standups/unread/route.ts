import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import TeamStandup from '@/models/TeamStandup';

export const dynamic = 'force-dynamic';

/**
 * GET /api/standups/unread?boardId=...&workspaceId=...
 * Returns the real unread notifications count from the TeamStandup model.
 */
export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const url = new URL(req.url);
        const boardId = url.searchParams.get('boardId');
        const workspaceId = url.searchParams.get('workspaceId');

        if (!boardId || !workspaceId) {
            return NextResponse.json({ success: false, error: 'Missing context' }, { status: 400 });
        }

        const today = new Date().toISOString().split('T')[0];

        const teamSync = await TeamStandup.findOne({ boardId, workspaceId, dateString: today })
            .select('unreadNotifications')
            .lean() as any;

        return NextResponse.json({
            success: true,
            unread: teamSync?.unreadNotifications || 0
        });
    } catch (error: any) {
        console.error('[Standup Unread API]', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
