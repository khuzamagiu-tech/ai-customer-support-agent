export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SupportStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed';
export type SenderType = 'customer' | 'admin' | 'ai';
export type UserRole = 'admin' | 'manager' | 'agent';
export type KnowledgeStatus = 'draft' | 'published' | 'archived';

export const SUPPORT_PRIORITIES: SupportPriority[] = ['low', 'normal', 'high', 'urgent'];
export const SUPPORT_STATUSES: SupportStatus[] = ['new', 'open', 'pending', 'resolved', 'closed'];
export const USER_ROLES: UserRole[] = ['admin', 'manager', 'agent'];
export const KNOWLEDGE_STATUSES: KnowledgeStatus[] = ['draft', 'published', 'archived'];

export interface HealthCheckResponse {
  status: 'ok';
  service: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: Record<string, unknown>;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  subject: string;
  status: SupportStatus;
  priority: SupportPriority;
  assignedAdminId?: string;
  source: 'email' | 'chat' | 'portal' | 'phone';
  intent?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: SenderType;
  senderId?: string;
  body: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: KnowledgeStatus;
  createdByAdminId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardSummary {
  openConversations: number;
  resolvedToday: number;
  highPriority: number;
  activeCustomers: number;
}
