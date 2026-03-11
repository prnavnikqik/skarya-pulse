import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamStandup extends Document {
    workspaceId: string;
    boardId: string;
    dateString: string; // e.g. "2026-03-11"
    
    // Extracted events/updates from individual team members during the day
    updates: Array<{
        userEmail: string;
        userName: string;
        timestamp: Date;
        type: string; // 'morning_update', 'evening_update', 'roadblock', 'general'
        synopsis: string; // Short 1-sentence synopsis of what they posted
        hasBlockers: boolean;
    }>;

    // The continuously updated/regenerated AI summary of the whole team's day
    summary: {
        lastGeneratedAt: Date;
        metrics: string; // "6 members · 3 blockers"
        tags: Array<{
            label: string;
            colorClass: string;
        }>;
        contentHtml: string;
    };

    // Tracking unread notifications
    unreadNotifications: number;
    
    createdAt: Date;
    updatedAt: Date;
}

const TeamStandupSchema: Schema = new Schema({
    workspaceId: { type: String, required: true },
    boardId: { type: String, required: true },
    dateString: { type: String, required: true }, // Format YYYY-MM-DD
    
    updates: [{
        userEmail: { type: String, required: true },
        userName: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        type: { type: String, default: 'general' },
        synopsis: { type: String, default: '' },
        hasBlockers: { type: Boolean, default: false }
    }],

    summary: {
        lastGeneratedAt: { type: Date },
        metrics: { type: String, default: '' },
        tags: [{ label: String, colorClass: String }],
        contentHtml: { type: String, default: '' }
    },

    unreadNotifications: { type: Number, default: 0 },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

TeamStandupSchema.index({ workspaceId: 1, boardId: 1, dateString: 1 }, { unique: true });

TeamStandupSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export default mongoose.models.TeamStandup || mongoose.model<ITeamStandup>('TeamStandup', TeamStandupSchema);
