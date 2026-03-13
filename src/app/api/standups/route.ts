import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Standup from '@/models/Standup';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userEmail = searchParams.get('userEmail');
        const boardId = searchParams.get('boardId');

        if (!userEmail || !boardId) {
            return NextResponse.json({ success: false, error: 'Missing userEmail or boardId' }, { status: 400 });
        }

        await connectToDatabase();

        const standups = await Standup.find({ userEmail, boardId }).sort({ createdAt: -1 }).limit(30);

        return NextResponse.json({ success: true, standups });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { yesterday, today, blockers, summary, userEmail, workspaceId, boardId } = await req.json();
        
        if (!userEmail || !workspaceId || !boardId) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        await connectToDatabase();
        const newStandup = new Standup({
            yesterday,
            today,
            blockers,
            summary,
            userEmail,
            workspaceId,
            boardId
        });
        await newStandup.save();
        return NextResponse.json({ success: true, standup: newStandup }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
