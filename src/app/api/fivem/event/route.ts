import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import logger from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing API key" },
        { status: 401 }
      );
    }

    const keyRecord = await prisma.aPIKey.findUnique({
      where: { key: apiKey },
      include: { server: true },
    });

    if (!keyRecord || !keyRecord.isActive || !keyRecord.server.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid or inactive API key" },
        { status: 403 }
      );
    }

    await prisma.aPIKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    const body = await req.json();
    const { playerLicense, detectionType, severity, metadata } = body;

    if (!playerLicense || !detectionType) {
      return NextResponse.json(
        { success: false, error: "Missing playerLicense or detectionType" },
        { status: 400 }
      );
    }

    const validSeverities = ["LOW", "MID", "HIGH", "CRIT"];
    const sev = validSeverities.includes(severity) ? severity : "MID";

    const log = await prisma.detectionLog.create({
      data: {
        playerLicense,
        detectionType,
        severity: sev,
        metadata: metadata ? JSON.stringify(metadata) : "{}",
        serverId: keyRecord.serverId,
      },
    });

    const ban = await prisma.bannedPlayer.findFirst({
      where: { license: playerLicense, isActive: true },
    });

    logger.info(
      { detectionId: log.id, license: playerLicense, type: detectionType, severity: sev },
      "Detection recorded"
    );

    return NextResponse.json({
      success: true,
      data: {
        id: log.id,
        action: ban ? "ALREADY_BANNED" : "LOGGED",
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to record detection event");
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
