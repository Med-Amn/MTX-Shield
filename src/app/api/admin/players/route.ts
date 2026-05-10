import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewAdminPanel, logAudit } from "@/lib/auth-utils";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canViewAdminPanel(session.user as Record<string, unknown>)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const serverId = searchParams.get("serverId") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));

  const where: Record<string, unknown> = {};
  if (serverId) where.serverId = serverId;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { hwid: { contains: search } },
      { ip: { contains: search } },
      { license: { contains: search } },
      { steamId: { contains: search } },
    ];
  }

  const [players, total] = await Promise.all([
    prisma.player.findMany({
      where,
      include: {
        server: { select: { name: true } },
        bans: { select: { id: true, isActive: true } },
      },
      orderBy: { lastSeen: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.player.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: players.map((p) => ({
      id: p.id,
      name: p.name,
      hwid: p.hwid,
      ip: p.ip,
      license: p.license,
      steamId: p.steamId,
      discordId: p.discordId,
      fivemId: p.fivemId,
      firstSeen: p.firstSeen.toISOString(),
      lastSeen: p.lastSeen.toISOString(),
      serverName: p.server.name,
      banCount: p.bans.length,
      isBanned: p.bans.some((b) => b.isActive),
    })),
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}
