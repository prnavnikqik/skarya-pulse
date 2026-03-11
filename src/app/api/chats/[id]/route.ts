import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import ChatSession from '@/models/ChatSession';

const MONGODB_URI = process.env.MONGODB_URI!;

async function connectToDatabase() {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(MONGODB_URI);
}

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const resolvedParams = await params;
        if (!resolvedParams || !resolvedParams.id) {
            return NextResponse.json({ error: 'Missing chat ID' }, { status: 400 });
        }

        const session = await ChatSession.findOne({ chatId: resolvedParams.id }).lean() as any;

        if (!session) {
            return NextResponse.json({ success: false, error: 'Chat session not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, messages: session.messages, type: session.type });
    } catch (err) {
        console.error('Failed to load chat by ID', err);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const resolvedParams = await params;
        if (!resolvedParams || !resolvedParams.id) {
            return NextResponse.json({ error: 'Missing chat ID' }, { status: 400 });
        }

        const session = await ChatSession.findOneAndDelete({ chatId: resolvedParams.id });
        if (!session) {
            return NextResponse.json({ success: false, error: 'Chat session not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Chat deleted' });
    } catch (err) {
        console.error('Failed to delete chat by ID', err);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const resolvedParams = await params;
        if (!resolvedParams || !resolvedParams.id) {
            return NextResponse.json({ error: 'Missing chat ID' }, { status: 400 });
        }

        const body = await req.json();
        const newTitle = body.title;

        if (!newTitle) {
            return NextResponse.json({ error: 'Missing title in body' }, { status: 400 });
        }

        const session = await ChatSession.findOneAndUpdate(
            { chatId: resolvedParams.id },
            { $set: { title: newTitle } },
            { new: true }
        );

        if (!session) {
            return NextResponse.json({ success: false, error: 'Chat session not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Chat renamed successfully', title: session.title });
    } catch (err) {
        console.error('Failed to rename chat by ID', err);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
