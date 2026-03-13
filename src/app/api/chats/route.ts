import { NextResponse } from 'next/server';
import ChatSession from '@/models/ChatSession';
import connectToDatabase from '@/lib/mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const userEmail = searchParams.get('userEmail');
        const workspaceId = searchParams.get('workspaceId');

        if (!userEmail || !workspaceId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const sessions = await ChatSession.find({ userEmail, workspaceId })
            .select('chatId title createdAt type')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, sessions });
    } catch (error: any) {
        console.error('Failed to fetch chat sessions:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
