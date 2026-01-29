// @ai:ag - Created by Antigravity
// Notification related types

import { TenantEntity } from './common.types';
import { NotificationType } from './enums';

/**
 * Notification data
 */
export interface Notification extends TenantEntity {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string | null;
    objectType?: string | null;
    objectId?: string | null;
    isRead: boolean;
    readAt?: Date | string | null;
}

/**
 * Notification preference
 */
export interface NotificationPreference extends TenantEntity {
    userId: string;
    emailEnabled: boolean;
    emailDigest: 'REALTIME' | 'DAILY' | 'WEEKLY';
    inAppEnabled: boolean;
    attendanceAlerts: boolean;
    leaveAlerts: boolean;
    approvalAlerts: boolean;
    announcementAlerts: boolean;
}

/**
 * Update notification preference
 */
export interface UpdateNotificationPreferenceRequest {
    emailEnabled?: boolean;
    emailDigest?: 'REALTIME' | 'DAILY' | 'WEEKLY';
    inAppEnabled?: boolean;
    attendanceAlerts?: boolean;
    leaveAlerts?: boolean;
    approvalAlerts?: boolean;
    announcementAlerts?: boolean;
}

/**
 * Notification summary
 */
export interface NotificationSummary {
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
}

/**
 * Announcement data
 */
export interface Announcement extends TenantEntity {
    title: string;
    content: string;
    targetAudience?: {
        branches?: string[];
        departments?: string[];
        roles?: string[];
    } | null;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    publishedById?: string | null;
    publishedAt?: Date | string | null;
    expiresAt?: Date | string | null;
}

/**
 * Create announcement request
 */
export interface CreateAnnouncementRequest {
    title: string;
    content: string;
    targetAudience?: {
        branches?: string[];
        departments?: string[];
        roles?: string[];
    };
    expiresAt?: Date | string;
}
