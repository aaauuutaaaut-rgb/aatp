/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ThreadsAccount {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  followersCount: number;
  status: 'active' | 'suspended' | 'disconnected';
  connectedAt: string;
  accessToken?: string;
  threadsUserId?: string;
  isRealOAuth?: boolean;
}

export interface ScheduledPost {
  id: string;
  accountIds: string[]; // accounts targeted
  text: string;
  mediaUrl?: string;
  scheduledTime: string; // ISO string
  status: 'pending' | 'posted' | 'failed';
  createdAt: string;
}

export interface ActionLog {
  id: string;
  timestamp: string; // HH:mm:ss
  type: 'post' | 'like' | 'comment' | 'system' | 'schedule_trigger';
  status: 'success' | 'warning' | 'info';
  message: string;
  accountUsername?: string;
}

export interface UserSession {
  username: string;
  isLoggedIn: boolean;
}
