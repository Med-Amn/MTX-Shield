import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, verifyHMAC } from "@/lib/security";
import logger from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await checkRateLimit(`verify-license:${ip}`, 60);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { licenseKey, serverIp, timestamp, signature } = body;

    if (!licenseKey || !serverIp || !timestamp || !signature) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const key = await prisma.licenseKey.findUnique({ where: { key: licenseKey } });
    if (!key) {
      return NextResponse.json({ success: false, error: "Invalid license key" }, { status: 404 });
    }

    // Verify HMAC
    const payload = `${licenseKey}:${serverIp}:${timestamp}`;
    if (!verifyHMAC(payload, signature, key.key)) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 403 });
    }

    // Check expiry
    const now = new Date();
    if (key.expiresAt < now) {
      await prisma.licenseKey.update({
        where: { id: key.id },
        data: { status: "EXPIRED" },
      });
      await prisma.keyLog.create({
        data: { keyId: key.id, action: "expire", detail: "License expired on verify" },
      });
      return NextResponse.json({
        success: true,
        data: { status: "expired", message: "License has expired" },
      });
    }

    // Check if server IP matches
    if (key.serverIp && key.serverIp !== serverIp) {
      return NextResponse.json({
        success: true,
        data: { status: "invalid", message: "Server IP mismatch" },
      });
    }

    // Bind key to server IP on first use
    if (!key.serverIp) {
      await prisma.licenseKey.update({
        where: { id: key.id },
        data: { serverIp, status: "ACTIVE" },
      });
      await prisma.keyLog.create({
        data: { keyId: key.id, action: "bind", detail: `Bound to ${serverIp}` },
      });
    }

    // Link or update server record
    if (key.serverId) {
      await prisma.server.update({
        where: { id: key.serverId },
        data: { ip: serverIp, isActive: true },
      });
    }

    await prisma.keyLog.create({
      data: { keyId: key.id, action: "verify", detail: `Verified from ${serverIp}` },
    });

    logger.info({ licenseKey: key.key.slice(0, 16), serverIp }, "License verified");

    return NextResponse.json({
      success: true,
      data: {
        status: "valid",
        plan: key.plan,
        expiresAt: key.expiresAt.toISOString(),
      },
    });
  } catch (err) {
    logger.error({ err }, "verify-license failed");
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
