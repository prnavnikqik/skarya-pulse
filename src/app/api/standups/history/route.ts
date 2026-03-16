import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Standup from '@/models/Standup';

export const dynamic = 'force-dynamic';

/**
 * GET /api/standups/history?chatIds=id1,id2,...
 * Returns a map of chatId -> standup data for enriching the history cards.
 * We match by date proximity since chatId isn't stored on Standup directly.
 */
export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const url = new URL(req.url);
        const chatIdsParam = url.searchParams.get('chatIds') || '';
        const userEmail = url.searchParams.get('userEmail') || '';

        // Fetch today and past 30 days of standups for this user
        const since = new Date();
        since.setDate(since.getDate() - 30);

        const standups = await Standup.find({
            ...(userEmail ? { userEmail } : {}),
            date: { $gte: since }
        }).sort({ createdAt: -1 }).lean();

        // Map them by date string so UI can look them up
        const dataByDate: Record<string, any> = {};
        for (const s of standups) {
            const dateKey = new Date(s.date || s.createdAt).toDateString();
            if (!dataByDate[dateKey]) {
                dataByDate[dateKey] = {
                    yesterday: s.yesterday,
                    today: s.today,
                    blockers: s.blockers,
                    summary: s.summary,
                    userEmail: s.userEmail
                };
            }
        }

        return NextResponse.json({ success: true, data: dataByDate });
    } catch (error: any) {
        console.error('[Standup History API]', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
