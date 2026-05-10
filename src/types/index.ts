export type PlanTier = "FREE" | "PRO" | "ELITE";

export type Severity = "LOW" | "MID" | "HIGH" | "CRIT";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MODERATOR";

export type SubscriptionStatus = "ACTIVE" | "CANCELED" | "PAST_DUE";

export type LicenseStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";

export type PlanInterval = "MONTHLY" | "YEARLY";

export type ProofType = "IMAGE" | "URL" | "LOG";

export interface DashboardStats {
  totalServers: number;
  activeBans: number;
  totalDetections: number;
  detectionsToday: number;
  detectionsBySeverity: Record<Severity, number>;
  recentDetections: DetectionEvent[];
}

export interface DetectionEvent {
  id: string;
  playerLicense: string;
  detectionType: string;
  severity: Severity;
  metadata: string;
  serverId: string;
  createdAt: string;
  serverName?: string;
}

export interface BanRecord {
  id: string;
  license: string;
  playerName: string | null;
  hwid: string | null;
  ip: string | null;
  steamId: string | null;
  discordId: string | null;
  fivemId: string | null;
  reason: string;
  evidence: string | null;
  serverId: string;
  isActive: boolean;
  bannedAt: string;
  expiresAt: string | null;
  unbannedAt: string | null;
  serverName?: string;
  bannedByName?: string;
  proofs?: BanProofRecord[];
}

export interface BanProofRecord {
  id: string;
  banId: string;
  type: ProofType;
  value: string;
  createdAt: string;
}

export interface ServerRecord {
  id: string;
  name: string;
  ip: string;
  port: number;
  isActive: boolean;
  apiKey: string;
  createdAt: string;
  plan: PlanTier;
}

export interface PlayerRecord {
  id: string;
  name: string | null;
  hwid: string | null;
  ip: string | null;
  license: string | null;
  steamId: string | null;
  discordId: string | null;
  fivemId: string | null;
  firstSeen: string;
  lastSeen: string;
  serverName?: string;
  banCount?: number;
  isBanned?: boolean;
}

export interface LicenseKeyRecord {
  id: string;
  key: string;
  plan: PlanTier;
  status: LicenseStatus;
  serverId: string | null;
  serverIp: string | null;
  issuedAt: string;
  expiresAt: string;
  renewedAt: string | null;
}

export interface SubscriptionInfo {
  plan: PlanTier;
  status: SubscriptionStatus;
  interval: PlanInterval;
  currentPeriodEnd: string | null;
  serversLimit: number;
  retentionDays: number;
  apiAccess: boolean;
  customRules: boolean;
}

export interface PricingPlanRecord {
  id: string;
  plan: PlanTier;
  interval: PlanInterval;
  price: number;
  isActive: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export const PLAN_LIMITS: Record<PlanTier, {
  serversLimit: number;
  retentionDays: number;
  apiAccess: boolean;
  customRules: boolean;
}> = {
  FREE: { serversLimit: 1, retentionDays: 7, apiAccess: false, customRules: false },
  PRO: { serversLimit: 3, retentionDays: 30, apiAccess: true, customRules: false },
  ELITE: { serversLimit: Infinity, retentionDays: 90, apiAccess: true, customRules: true },
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 50,
  MODERATOR: 10,
};
