import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewAdminPanel } from "@/lib/auth-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canViewAdminPanel(session.user as Record<string, unknown>)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      server: { select: { name: true } },
      bans: {
        include: {
          server: { select: { name: true } },
          bannedBy: { select: { name: true } },
          proofs: true,
        },
        orderBy: { bannedAt: "desc" },
      },
    },
  });

  if (!player) {
    return NextResponse.json({ success: false, error: "Player not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: player.id,
      name: player.name,
      hwid: player.hwid,
      ip: player.ip,
      license: player.license,
      steamId: player.steamId,
      discordId: player.discordId,
      fivemId: player.fivemId,
      firstSeen: player.firstSeen.toISOString(),
      lastSeen: player.lastSeen.toISOString(),
      serverName: player.server.name,
      bans: player.bans.map((b) => ({
        id: b.id,
        reason: b.reason,
        isActive: b.isActive,
        bannedAt: b.bannedAt.toISOString(),
        expiresAt: b.expiresAt?.toISOString() ?? null,
        unbannedAt: b.unbannedAt?.toISOString() ?? null,
        serverName: b.server.name,
        bannedByName: b.bannedBy.name,
        proofs: b.proofs.map((p) => ({
          id: p.id,
          type: p.type,
          value: p.value,
          createdAt: p.createdAt.toISOString(),
        })),
      })),
    },
  });
}
