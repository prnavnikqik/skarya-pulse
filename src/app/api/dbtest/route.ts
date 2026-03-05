import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';

export async function GET() {
    try {
        await connectToDatabase();
        return NextResponse.json({ success: true, message: 'MongoDB connection successful' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
