import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageBans, logAudit } from "@/lib/auth-utils";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canManageBans(session.user as Record<string, unknown>)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const serverId = searchParams.get("serverId") ?? "";
  const active = searchParams.get("active");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));

  const where: Record<string, unknown> = {};
  if (serverId) where.serverId = serverId;
  if (active === "true") where.isActive = true;
  if (active === "false") where.isActive = false;
  if (search) {
    where.OR = [
      { license: { contains: search } },
      { reason: { contains: search } },
      { playerName: { contains: search } },
      { hwid: { contains: search } },
      { ip: { contains: search } },
    ];
  }

  const [bans, total] = await Promise.all([
    prisma.bannedPlayer.findMany({
      where,
      include: {
        server: { select: { name: true } },
        bannedBy: { select: { name: true } },
        proofs: true,
        player: { select: { name: true, hwid: true, ip: true } },
      },
      orderBy: { bannedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bannedPlayer.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: bans.map((b) => ({
      id: b.id,
      license: b.license,
      playerName: b.playerName ?? b.player?.name ?? null,
      hwid: b.hwid ?? b.player?.hwid ?? null,
      ip: b.ip ?? b.player?.ip ?? null,
      steamId: b.steamId,
      discordId: b.discordId,
      fivemId: b.fivemId,
      reason: b.reason,
      evidence: b.evidence,
      serverId: b.serverId,
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
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canManageBans(session.user as Record<string, unknown>)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { license, playerName, hwid, ip, reason, serverId, steamId, discordId, fivemId, evidence, expiresAt, proofs } = body;

  if (!license || !reason || !serverId) {
    return NextResponse.json(
      { success: false, error: "Missing required: license, reason, serverId" },
      { status: 400 }
    );
  }

  const server = await prisma.server.findUnique({ where: { id: serverId } });
  if (!server) {
    return NextResponse.json({ success: false, error: "Server not found" }, { status: 404 });
  }

  // Upsert player record
  const player = await prisma.player.upsert({
    where: { id: license },
    update: { name: playerName ?? undefined, hwid: hwid ?? undefined, ip: ip ?? undefined, lastSeen: new Date() },
    create: { id: license, name: playerName, hwid, ip, license, steamId, discordId, fivemId, serverId },
  });

  const ban = await prisma.bannedPlayer.create({
    data: {
      license,
      playerName,
      hwid,
      ip,
      reason,
      serverId,
      steamId,
      discordId,
      fivemId,
      evidence,
      bannedById: session.user.id,
      playerId: player.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  // Create proofs if provided
  if (proofs && Array.isArray(proofs)) {
    await prisma.banProof.createMany({
      data: proofs.map((p: { type: string; value: string }) => ({
        banId: ban.id,
        type: p.type ?? "URL",
        value: p.value,
      })),
    });
  }

  logger.info({ banId: ban.id, license }, "Admin banned player");
  await logAudit(session.user.id, "ban.create", `player:${license}`, reason);

  return NextResponse.json({ success: true, data: ban }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canManageBans(session.user as Record<string, unknown>)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ success: false, error: "Missing ban id" }, { status: 400 });
  }

  const ban = await prisma.bannedPlayer.findUnique({ where: { id } });
  if (!ban) {
    return NextResponse.json({ success: false, error: "Ban not found" }, { status: 404 });
  }

  const updated = await prisma.bannedPlayer.update({
    where: { id },
    data: { isActive: false, unbannedAt: new Date() },
  });

  logger.info({ banId: id }, "Admin unbanned player");
  await logAudit(session.user.id, "ban.unban", `license:${ban.license}`);

  return NextResponse.json({ success: true, data: updated });
}
