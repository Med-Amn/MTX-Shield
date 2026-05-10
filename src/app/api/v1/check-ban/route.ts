import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const license = searchParams.get("license");

    if (!license) {
      return NextResponse.json(
        { success: false, error: "Missing license parameter" },
        { status: 400 }
      );
    }

    const ban = await prisma.bannedPlayer.findFirst({
      where: { license, isActive: true },
      select: {
        id: true,
        reason: true,
        bannedAt: true,
        expiresAt: true,
        server: { select: { name: true } },
      },
    });

    if (!ban) {
      return NextResponse.json({ success: true, data: { banned: false } });
    }

    if (ban.expiresAt && ban.expiresAt < new Date()) {
      await prisma.bannedPlayer.update({
        where: { id: ban.id },
        data: { isActive: false, unbannedAt: new Date() },
      });
      return NextResponse.json({ success: true, data: { banned: false } });
    }

    return NextResponse.json({
      success: true,
      data: {
        banned: true,
        reason: ban.reason,
        bannedAt: ban.bannedAt.toISOString(),
        expiresAt: ban.expiresAt?.toISOString() ?? null,
        server: ban.server.name,
      },
    });
  } catch (err) {
    logger.error({ err }, "Check ban failed");
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
