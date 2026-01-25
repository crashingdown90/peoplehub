// @ai:ag - Created by Antigravity
// Enhanced Announcement types (extends basic Announcement in notification.types.ts)

import { TenantEntity } from './common.types';
import { AnnouncementStatus as AnnouncementStatusEnum } from './enums';

// Re-export for convenience
export { AnnouncementStatusEnum };

// ==========================================
// ANNOUNCEMENT LABELS (Indonesian)
// ==========================================

export const ANNOUNCEMENT_STATUS_LABELS: Record<string, string> = {
    DRAFT: 'Draf',
    PUBLISHED: 'Dipublikasi',
    ARCHIVED: 'Diarsipkan',
};

export const ANNOUNCEMENT_STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-yellow-100 text-yellow-800',
};

// ==========================================
// ANNOUNCEMENT PRIORITY
// ==========================================

export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export const ANNOUNCEMENT_PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
    LOW: 'Rendah',
    NORMAL: 'Normal',
    HIGH: 'Tinggi',
    URGENT: 'Mendesak',
};

export const ANNOUNCEMENT_PRIORITY_COLORS: Record<AnnouncementPriority, string> = {
    LOW: 'bg-gray-100 text-gray-800',
    NORMAL: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-amber-100 text-amber-800',
    URGENT: 'bg-red-100 text-red-800',
};

// ==========================================
// ENHANCED ANNOUNCEMENT (with priority and more fields)
// ==========================================

export interface EnhancedAnnouncement extends TenantEntity {
    title: string;
    content: string;
    excerpt?: string | null;
    status: AnnouncementStatusEnum;
    priority: AnnouncementPriority;
    authorId: string;
    publishedAt?: Date | string | null;
    scheduledAt?: Date | string | null;
    expiresAt?: Date | string | null;
    isPinned: boolean;
    viewCount: number;
    targetRoles?: string[] | null;
    targetDepartments?: string[] | null;
    attachments?: AnnouncementAttachment[];
    reactions?: AnnouncementReaction[];
    author?: {
        id: string;
        name: string;
        avatarUrl?: string | null;
    };
}

// ==========================================
// ANNOUNCEMENT ATTACHMENT
// ==========================================

export interface AnnouncementAttachment {
    id: string;
    announcementId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
}

export interface CreateAnnouncementAttachmentInput {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
}

// ==========================================
// ANNOUNCEMENT REACTION
// ==========================================

export type AnnouncementReactionType = 'LIKE' | 'LOVE' | 'CELEBRATE' | 'INSIGHTFUL';

export interface AnnouncementReaction {
    id: string;
    announcementId: string;
    userId: string;
    type: AnnouncementReactionType;
    createdAt: Date | string;
}

// ==========================================
// ANNOUNCEMENT READ STATUS
// ==========================================

export interface AnnouncementReadStatus {
    announcementId: string;
    userId: string;
    readAt: Date | string;
}

// ==========================================
// ANNOUNCEMENT SUMMARY
// ==========================================

export interface AnnouncementListSummary {
    totalAnnouncements: number;
    publishedCount: number;
    draftCount: number;
    archivedCount: number;
    unreadCount: number;
}
