import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import logger from "@/lib/logger";
import crypto from "crypto";

async function getUser(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function GET() {
  const user = await getUser(null as unknown as NextRequest);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const servers = await prisma.server.findMany({
    where: { userId: user.id },
    include: { subscription: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: servers.map((s) => ({
      id: s.id,
      name: s.name,
      ip: s.ip,
      port: s.port,
      isActive: s.isActive,
      apiKey: s.apiKey,
      createdAt: s.createdAt.toISOString(),
      plan: s.subscription?.plan ?? "FREE",
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, ip, port } = body;

  if (!name || !ip || !port) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: name, ip, port" },
      { status: 400 }
    );
  }

  const serverCount = await prisma.server.count({ where: { userId: user.id } });
  const subscription = await prisma.subscription.findFirst({
    where: { server: { userId: user.id } },
  });
  const plan = (subscription?.plan as "FREE" | "PRO" | "ELITE") ?? "FREE";
  const limits = { FREE: 1, PRO: 3, ELITE: Infinity };
  if (serverCount >= limits[plan]) {
    return NextResponse.json(
      { success: false, error: `Server limit reached for ${plan} plan. Upgrade to add more servers.` },
      { status: 403 }
    );
  }

  const apiKey = `mtx_${crypto.randomBytes(24).toString("hex")}`;

  const server = await prisma.server.create({
    data: { userId: user.id, name, ip, port: Number(port), apiKey },
  });

  logger.info({ serverId: server.id }, "Server created");

  return NextResponse.json({ success: true, data: server }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing server id" }, { status: 400 });
  }

  const server = await prisma.server.findFirst({ where: { id, userId: user.id } });
  if (!server) {
    return NextResponse.json({ success: false, error: "Server not found" }, { status: 404 });
  }

  await prisma.server.delete({ where: { id } });
  logger.info({ serverId: id }, "Server deleted");

  return NextResponse.json({ success: true });
}
