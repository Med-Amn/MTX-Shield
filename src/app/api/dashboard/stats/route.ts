import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import logger from "@/lib/logger";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const servers = await prisma.server.findMany({ where: { userId } });
    const serverIds = servers.map((s) => s.id);

    const [activeBans, totalDetections, detectionsToday, detectionsBySeverity] =
      await Promise.all([
        prisma.bannedPlayer.count({
          where: { serverId: { in: serverIds }, isActive: true },
        }),
        prisma.detectionLog.count({
          where: { serverId: { in: serverIds } },
        }),
        prisma.detectionLog.count({
          where: { serverId: { in: serverIds }, createdAt: { gte: todayStart } },
        }),
        prisma.detectionLog.groupBy({
          by: ["severity"],
          where: { serverId: { in: serverIds } },
          _count: true,
        }),
      ]);

    const recentDetections = await prisma.detectionLog.findMany({
      where: { serverId: { in: serverIds } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { server: { select: { name: true } } },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalServers: servers.length,
        activeBans,
        totalDetections,
        detectionsToday,
        detectionsBySeverity: Object.fromEntries(
          detectionsBySeverity.map((d) => [d.severity, d._count])
        ),
        recentDetections: recentDetections.map((d) => ({
          id: d.id,
          playerLicense: d.playerLicense,
          detectionType: d.detectionType,
          severity: d.severity,
          metadata: d.metadata,
          serverId: d.serverId,
          createdAt: d.createdAt.toISOString(),
          serverName: d.server.name,
        })),
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch dashboard stats");
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
