import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { StandupSession } from '@/models/StandupSession';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const boardId = searchParams.get('boardId');
        const standupDate = searchParams.get('standupDate') || new Date().toISOString().split('T')[0];

        if (!boardId) {
            return NextResponse.json({ error: 'boardId is required' }, { status: 400 });
        }

        await connectToDatabase();

        // Find all sessions for the given board and date
        const sessions = await StandupSession.find({
            boardId,
            standupDate
        });

        // Transform into member summaries
        const memberSummaries = sessions.map((session) => {
            const isConfirmed = session.status === 'confirmed';
            const output = session.confirmedOutput || session.llmOutput;

            const summaryText = output?.summary_for_lead || (isConfirmed ? 'Updates submitted.' : 'Still in progress...');

            const completedTaskNums = output?.task_updates
                ?.filter((tu: any) => tu.statusCategory === 'completed')
                .map((tu: any) => tu.taskNumber) || [];

            const inProgressTaskNums = output?.task_updates
                ?.filter((tu: any) => tu.statusCategory === 'in_progress')
                .map((tu: any) => tu.taskNumber) || [];

            const sessionBlockers = output?.roadblock_comments?.map((rc: any) => ({
                taskId: rc.taskId,
                taskName: rc.taskNumber,
                reason: rc.comment
            })) || [];

            return {
                userEmail: session.userId,
                userName: session.userName,
                status: isConfirmed ? 'submitted' : (session.status === 'completed' ? 'pending' : 'in_progress'),
                submittedAt: session.confirmedAt,
                summary: summaryText,
                tasksCompleted: completedTaskNums,
                tasksInProgress: inProgressTaskNums,
                blockers: sessionBlockers
            };
        });

        const summaryData = {
            boardId,
            standupDate,
            memberSummaries,
        };

        return NextResponse.json({ success: true, data: summaryData });
    } catch (error: any) {
        console.error('[API /api/standup/summary] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
