import mongoose, { Schema, Document } from 'mongoose';

export interface IStandup extends Document {
    userEmail: string;
    workspaceId: string;
    boardId: string;
    date: Date;
    yesterday: string;
    today: string;
    blockers: string;
    summary?: string;
    createdAt: Date;
}

const StandupSchema: Schema = new Schema({
    userEmail: { type: String, required: true },
    workspaceId: { type: String, required: true },
    boardId: { type: String, required: true },
    date: { type: Date, default: Date.now },
    yesterday: { type: String, required: true },
    today: { type: String, required: true },
    blockers: { type: String, default: 'None' },
    summary: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
});

// Avoid OverwriteModelError in development hot-reloads
export default mongoose.models.Standup || mongoose.model<IStandup>('Standup', StandupSchema);
