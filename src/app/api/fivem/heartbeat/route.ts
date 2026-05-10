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
    });

    if (!keyRecord || !keyRecord.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid API key" },
        { status: 403 }
      );
    }

    await prisma.aPIKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    await prisma.server.update({
      where: { id: keyRecord.serverId },
      data: { isActive: true },
    });

    return NextResponse.json({ success: true, data: { status: "ok" } });
  } catch (err) {
    logger.error({ err }, "Heartbeat failed");
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
