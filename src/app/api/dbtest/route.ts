import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';

export async function GET() {
    try {
        const { TaskWriter } = await import('@/integrations/task-writer');
        
        const result = await TaskWriter.createTask({
            name: "Test Task from API route - " + new Date().toISOString(),
            boardId: "69a2118ecf1d73e568280ba5",
            workspaceId: "69a202afcf1d73e568280529",
            assigneeEmail: "pranav.patil@nikqik.com",
            status: "To Do",
            priority: "Medium",
            createdBy: "pranav.patil@nikqik.com"
        });

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
