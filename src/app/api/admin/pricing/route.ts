import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageAdmins, logAudit } from "@/lib/auth-utils";
import logger from "@/lib/logger";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canManageAdmins(session.user as Record<string, unknown>)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const pricing = await prisma.pricingPlan.findMany({ orderBy: [{ plan: "asc" }, { interval: "asc" }] });

  return NextResponse.json({
    success: true,
    data: pricing.map((p) => ({
      id: p.id,
      plan: p.plan,
      interval: p.interval,
      price: p.price,
      isActive: p.isActive,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canManageAdmins(session.user as Record<string, unknown>)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { plan, interval, price, isActive } = body;

  if (!plan || !interval) {
    return NextResponse.json({ success: false, error: "Missing plan or interval" }, { status: 400 });
  }

  const pricing = await prisma.pricingPlan.upsert({
    where: { plan_interval: { plan, interval } },
    update: { price: price ?? 0, isActive: isActive ?? true },
    create: { plan, interval, price: price ?? 0, isActive: isActive ?? true },
  });

  logger.info({ plan, interval, price }, "Pricing updated");
  await logAudit(session.user.id, "pricing.update", `${plan}_${interval}`, `${price}`);

  return NextResponse.json({ success: true, data: pricing });
}
