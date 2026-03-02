import mongoose, { Schema, Document } from 'mongoose';
import { StandupSession as IStandupSession } from '@/types';

// Omit the `id` field from IStandupSession because Mongoose uses `_id` 
// but we will add a virtual `id` or just handle it seamlessly.
export interface StandupSessionDocument extends Omit<IStandupSession, 'id'>, Document {
    id: string;
}

// Minimal nested schemas for structured subdocuments
const ConversationMessageSchema = new Schema({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: String, required: true }
}, { _id: false });

const WritebackResultSchema = new Schema({
    operation: { type: String, required: true },
    status: { type: String, enum: ['success', 'failed', 'skipped'], required: true },
    error: { type: String }
}, { _id: false });

const StandupSessionSchema = new Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    workspaceId: { type: String, required: true },
    boardId: { type: String, required: true },
    standupDate: { type: String, required: true },
    status: {
        type: String,
        enum: ['created', 'in_progress', 'completed', 'confirmed', 'cancelled'],
        default: 'created'
    },
    conversationHistory: [ConversationMessageSchema],
    // Store the complex nested structures as mixed types to allow rapid prototyping
    taskContextSnapshot: { type: Schema.Types.Mixed, default: [] },
    llmOutput: { type: Schema.Types.Mixed, default: null },
    confirmedOutput: { type: Schema.Types.Mixed, default: null },
    writebackResults: [WritebackResultSchema],
    createdAt: { type: String, required: true, default: () => new Date().toISOString() },
    updatedAt: { type: String, required: true, default: () => new Date().toISOString() },
    completedAt: { type: String, default: null },
    confirmedAt: { type: String, default: null }
}, { minimize: false });

// Ensure virtuals are included when converting to JSON
StandupSessionSchema.set('toJSON', {
    virtuals: true,
    transform: (doc: any, ret: any) => {
        // @ts-ignore
        ret.id = ret._id?.toString() || '';
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

// Update the updatedAt timestamp before saving
StandupSessionSchema.pre('save', function () {
    this.updatedAt = new Date().toISOString();
});

export const StandupSession = mongoose.models.StandupSession || mongoose.model<StandupSessionDocument>('StandupSession', StandupSessionSchema);
