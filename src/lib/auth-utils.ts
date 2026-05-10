import { prisma } from "@/lib/db";
import type { UserRole } from "@/types";
import { ROLE_HIERARCHY } from "@/types";

export function getUserRole(user: Record<string, unknown> | null | undefined): string {
  return (user?.role as string) ?? "ADMIN";
}

export function hasAccess(
  userRole: string,
  requiredRole: UserRole
): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as UserRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

export function canManageBans(user: Record<string, unknown> | null | undefined): boolean {
  return hasAccess(getUserRole(user), "MODERATOR");
}

export function canManageAdmins(user: Record<string, unknown> | null | undefined): boolean {
  return hasAccess(getUserRole(user), "SUPER_ADMIN");
}

export function canViewAdminPanel(user: Record<string, unknown> | null | undefined): boolean {
  return hasAccess(getUserRole(user), "MODERATOR");
}

export async function logAudit(
  userId: string | undefined,
  action: string,
  target?: string,
  detail?: string,
  ip?: string
) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, target, detail, ip },
    });
  } catch {
  }
}
