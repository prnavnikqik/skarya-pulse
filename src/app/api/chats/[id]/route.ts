import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import ChatSession from '@/models/ChatSession';

const MONGODB_URI = process.env.MONGODB_URI!;

async function connectToDatabase() {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(MONGODB_URI);
}

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        if (!params || !params.id) {
            return NextResponse.json({ error: 'Missing chat ID' }, { status: 400 });
        }

        const session = await ChatSession.findOne({ chatId: params.id }).lean() as any;

        if (!session) {
            return NextResponse.json({ success: false, error: 'Chat session not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, messages: session.messages });
    } catch (err) {
        console.error('Failed to load chat by ID', err);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
