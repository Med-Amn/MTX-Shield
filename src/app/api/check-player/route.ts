import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, verifyHMAC } from "@/lib/security";
import logger from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await checkRateLimit(`check-player:${ip}`, 60);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { licenseKey, hwid, ip: playerIp, playerName, license, timestamp, signature } = body;

    if (!licenseKey || !hwid || !timestamp || !signature) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const key = await prisma.licenseKey.findUnique({
      where: { key: licenseKey },
      include: { server: true },
    });
    if (!key || key.status !== "ACTIVE") {
      return NextResponse.json({ success: false, error: "Invalid license" }, { status: 403 });
    }

    const payload = `${licenseKey}:${hwid}:${playerIp ?? ""}:${timestamp}`;
    if (!verifyHMAC(payload, signature, key.key)) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 403 });
    }

    if (key.expiresAt < new Date()) {
      return NextResponse.json({ success: true, data: { status: "license_expired" } });
    }

    // Upsert player
    if (key.serverId) {
      const playerId = `${key.serverId}:${hwid}`;
      await prisma.player.upsert({
        where: { id: playerId },
        update: { name: playerName ?? undefined, ip: playerIp ?? undefined, license: license ?? undefined, lastSeen: new Date() },
        create: { id: playerId, name: playerName, hwid, ip: playerIp, license, serverId: key.serverId },
      });
    }

    // Check for active bans
    const ban = await prisma.bannedPlayer.findFirst({
      where: {
        OR: [
          ...(hwid ? [{ hwid }] : []),
          ...(license ? [{ license }] : []),
          ...(playerIp ? [{ ip: playerIp }] : []),
        ].length ? [
          ...(hwid ? [{ hwid }] : []),
          ...(license ? [{ license }] : []),
          ...(playerIp ? [{ ip: playerIp }] : []),
        ] : [],
        isActive: true,
      },
      orderBy: { bannedAt: "desc" },
    });

    // Also check by HWID against BannedPlayer
    const banHwid = hwid ? await prisma.bannedPlayer.findFirst({
      where: { hwid, isActive: true },
      orderBy: { bannedAt: "desc" },
    }) : null;

    const activeBan = ban ?? banHwid;

    if (activeBan) {
      logger.info({ hwid, license }, "Player check returned banned");
      return NextResponse.json({
        success: true,
        data: {
          status: "banned",
          reason: activeBan.reason,
          bannedAt: activeBan.bannedAt.toISOString(),
          expiresAt: activeBan.expiresAt?.toISOString() ?? null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { status: "clean" },
    });
  } catch (err) {
    logger.error({ err }, "check-player failed");
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
