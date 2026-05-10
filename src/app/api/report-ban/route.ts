import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, verifyHMAC } from "@/lib/security";
import logger from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await checkRateLimit(`report-ban:${ip}`, 30);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { licenseKey, playerName, hwid, playerIp, license, reason, detectionType, timestamp, signature } = body;

    if (!licenseKey || !hwid || !reason || !timestamp || !signature) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const key = await prisma.licenseKey.findUnique({
      where: { key: licenseKey },
      include: { server: true },
    });
    if (!key || key.status !== "ACTIVE" || !key.serverId) {
      return NextResponse.json({ success: false, error: "Invalid license" }, { status: 403 });
    }

    const payload = `${licenseKey}:${hwid}:${reason}:${timestamp}`;
    if (!verifyHMAC(payload, signature, key.key)) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 403 });
    }

    if (key.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: "License expired" }, { status: 403 });
    }

    // Upsert player
    const playerId = `${key.serverId}:${hwid}`;
    const player = await prisma.player.upsert({
      where: { id: playerId },
      update: { name: playerName ?? undefined, ip: playerIp ?? undefined, license: license ?? undefined, lastSeen: new Date() },
      create: { id: playerId, name: playerName, hwid, ip: playerIp, license, serverId: key.serverId },
    });

    // Create detection log
    await prisma.detectionLog.create({
      data: {
        playerLicense: license ?? hwid,
        detectionType: detectionType ?? "AUTO_BAN",
        severity: "CRIT",
        metadata: JSON.stringify({ playerName, hwid, playerIp, reason }),
        serverId: key.serverId,
      },
    });

    // Create ban if player is not already banned
    const existingBan = await prisma.bannedPlayer.findFirst({
      where: { hwid, isActive: true },
    });

    if (!existingBan) {
      const ban = await prisma.bannedPlayer.create({
        data: {
          license: license ?? hwid,
          playerName,
          hwid,
          ip: playerIp,
          reason: `[AUTO] ${reason}`,
          serverId: key.serverId,
          bannedById: key.server?.userId ?? "",
          playerId: player.id,
        },
      });

      logger.info({ banId: ban.id, hwid }, "Auto-ban created via report-ban");

      return NextResponse.json({
        success: true,
        data: { status: "confirmed", banId: ban.id },
      });
    }

    return NextResponse.json({
      success: true,
      data: { status: "already_banned", banId: existingBan.id },
    });
  } catch (err) {
    logger.error({ err }, "report-ban failed");
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
