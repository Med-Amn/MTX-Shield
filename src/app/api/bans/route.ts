import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import logger from "@/lib/logger";

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const activeOnly = searchParams.get("active") !== "false";

  const servers = await prisma.server.findMany({ where: { userId: user.id } });
  const serverIds = servers.map((s) => s.id);

  const where = {
    serverId: { in: serverIds },
    isActive: activeOnly ? true : undefined,
    ...(search
      ? {
          OR: [
            { license: { contains: search } },
            { reason: { contains: search } },
          ],
        }
      : {}),
  };

  const bans = await prisma.bannedPlayer.findMany({
    where,
    orderBy: { bannedAt: "desc" },
    include: { server: { select: { name: true } } },
  });

  return NextResponse.json({
    success: true,
    data: bans.map((b) => ({
      id: b.id,
      license: b.license,
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
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { license, reason, serverId, steamId, discordId, fivemId, evidence, expiresAt } = body;

  if (!license || !reason || !serverId) {
    return NextResponse.json(
      { success: false, error: "Missing required: license, reason, serverId" },
      { status: 400 }
    );
  }

  const server = await prisma.server.findFirst({ where: { id: serverId, userId: user.id } });
  if (!server) {
    return NextResponse.json({ success: false, error: "Server not found" }, { status: 404 });
  }

  const ban = await prisma.bannedPlayer.create({
    data: {
      license,
      reason,
      serverId,
      steamId,
      discordId,
      fivemId,
      evidence,
      bannedById: user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  logger.info({ banId: ban.id, license }, "Player banned");

  return NextResponse.json({ success: true, data: ban }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ success: false, error: "Missing ban id" }, { status: 400 });
  }

  const ban = await prisma.bannedPlayer.findFirst({
    where: { id, server: { userId: user.id } },
  });
  if (!ban) {
    return NextResponse.json({ success: false, error: "Ban not found" }, { status: 404 });
  }

  const updated = await prisma.bannedPlayer.update({
    where: { id },
    data: { isActive: false, unbannedAt: new Date() },
  });

  logger.info({ banId: id }, "Player unbanned");

  return NextResponse.json({ success: true, data: updated });
}
