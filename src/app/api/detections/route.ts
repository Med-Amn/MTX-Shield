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
  const severity = searchParams.get("severity");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  const servers = await prisma.server.findMany({ where: { userId: user.id } });
  const serverIds = servers.map((s) => s.id);

  const where = {
    serverId: { in: serverIds },
    ...(severity ? { severity } : {}),
  };

  const detections = await prisma.detectionLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { server: { select: { name: true } } },
  });

  return NextResponse.json({
    success: true,
    data: detections.map((d) => ({
      id: d.id,
      playerLicense: d.playerLicense,
      detectionType: d.detectionType,
      severity: d.severity,
      metadata: d.metadata,
      serverId: d.serverId,
      createdAt: d.createdAt.toISOString(),
      serverName: d.server.name,
    })),
  });
}
