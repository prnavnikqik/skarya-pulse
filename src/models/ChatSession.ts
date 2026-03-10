import mongoose, { Schema, Document } from 'mongoose';

export interface IChatSession extends Document {
    chatId: string;
    userEmail: string;
    workspaceId: string;
    boardId: string;
    title: string;
    type: string;
    messages: any[];
    createdAt: Date;
    updatedAt: Date;
}

const ChatSessionSchema: Schema = new Schema({
    chatId: { type: String, required: true, unique: true },
    userEmail: { type: String, required: true },
    workspaceId: { type: String, required: true },
    boardId: { type: String, required: true },
    title: { type: String, default: 'New Conversation' },
    type: { type: String, default: 'chat' }, // 'chat' or 'standup'
    messages: { type: Schema.Types.Mixed, default: [] }, // Array of message objects matching AI SDK format
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

ChatSessionSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export default mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
