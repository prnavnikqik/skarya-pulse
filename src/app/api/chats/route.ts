import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import ChatSession from '@/models/ChatSession';

const MONGODB_URI = process.env.MONGODB_URI!;

async function connectToDatabase() {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(MONGODB_URI);
}

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
