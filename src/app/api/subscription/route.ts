import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe, STRIPE_PRICES, PLANS } from "@/lib/stripe";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/auth-utils";
import crypto from "crypto";
import type { PlanTier, PlanInterval } from "@/types";

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const sub = await prisma.subscription.findFirst({
    where: { server: { userId: user.id } },
    orderBy: { createdAt: "desc" },
  });

  const plan = (sub?.plan as PlanTier) ?? "FREE";
  const limits = {
    FREE: { serversLimit: 1, retentionDays: 7, apiAccess: false, customRules: false },
    PRO: { serversLimit: 3, retentionDays: 30, apiAccess: true, customRules: false },
    ELITE: { serversLimit: Infinity, retentionDays: 90, apiAccess: true, customRules: true },
  }[plan];

  const licenses = await prisma.licenseKey.findMany({
    where: { server: { userId: user.id } },
    orderBy: { issuedAt: "desc" },
  });

  const pricingPlans = await prisma.pricingPlan.findMany({
    where: { isActive: true },
  });

  return NextResponse.json({
    success: true,
    data: {
      plan,
      status: sub?.status ?? "ACTIVE",
      interval: (sub?.interval as PlanInterval) ?? "MONTHLY",
      currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
      ...limits,
      licenses: licenses.map((l) => ({
        id: l.id,
        key: l.key,
        plan: l.plan,
        status: l.status,
        serverId: l.serverId,
        serverIp: l.serverIp,
        issuedAt: l.issuedAt.toISOString(),
        expiresAt: l.expiresAt.toISOString(),
        renewedAt: l.renewedAt?.toISOString() ?? null,
      })),
      pricingPlans: pricingPlans.map((p) => ({
        id: p.id,
        plan: p.plan,
        interval: p.interval,
        price: p.price,
        isActive: p.isActive,
      })),
    },
  });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { plan, interval }: { plan: PlanTier; interval: PlanInterval } = body;

  if (!plan || plan === "FREE") {
    return NextResponse.json({ success: false, error: "Invalid plan" }, { status: 400 });
  }

  const priceKey = `${plan}_${interval}` as keyof typeof STRIPE_PRICES;
  const priceId = STRIPE_PRICES[priceKey];

  if (!priceId) {
    return NextResponse.json({ success: false, error: "Pricing not configured" }, { status: 400 });
  }

  const server = await prisma.server.findFirst({ where: { userId: user.id } });
  if (!server) {
    return NextResponse.json(
      { success: false, error: "Create a server before upgrading" },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email ?? undefined,
      metadata: {
        userId: user.id,
        serverId: server.id,
        plan,
        interval,
      },
      success_url: `${process.env.BETTER_AUTH_URL}/dashboard/subscription?success=true`,
      cancel_url: `${process.env.BETTER_AUTH_URL}/dashboard/subscription?canceled=true`,
    });

    logger.info({ userId: user.id, plan, interval }, "Checkout session created");
    await logAudit(user.id, "checkout.create", `plan:${plan}`, `interval:${interval}`);

    return NextResponse.json({ success: true, data: { url: session.url } });
  } catch (err) {
    logger.error({ err, userId: user.id }, "Failed to create checkout session");
    return NextResponse.json(
      { success: false, error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
