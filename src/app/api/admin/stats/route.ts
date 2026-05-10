import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewAdminPanel } from "@/lib/auth-utils";
import logger from "@/lib/logger";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canViewAdminPanel(session.user as Record<string, unknown>)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalPlayers,
    totalBans,
    activeBans,
    detectionsToday,
    totalServers,
    totalLicenses,
    recentBans,
  ] = await Promise.all([
    prisma.player.count(),
    prisma.bannedPlayer.count(),
    prisma.bannedPlayer.count({ where: { isActive: true } }),
    prisma.detectionLog.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.server.count(),
    prisma.licenseKey.count(),
    prisma.bannedPlayer.findMany({
      where: { isActive: true },
      orderBy: { bannedAt: "desc" },
      take: 10,
      include: { server: { select: { name: true } }, bannedBy: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      totalPlayers,
      totalBans,
      activeBans,
      detectionsToday,
      totalServers,
      totalLicenses,
      recentBans: recentBans.map((b) => ({
        id: b.id,
        license: b.license,
        reason: b.reason,
        serverName: b.server.name,
        bannedByName: b.bannedBy.name,
        bannedAt: b.bannedAt.toISOString(),
      })),
    },
  });
}
