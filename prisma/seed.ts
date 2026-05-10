import "dotenv/config";
import { prisma } from "../src/lib/db";

async function seed() {
  const plans = [
    { plan: "PRO", interval: "MONTHLY", price: 999 },
    { plan: "PRO", interval: "YEARLY", price: 9999 },
    { plan: "ELITE", interval: "MONTHLY", price: 2499 },
    { plan: "ELITE", interval: "YEARLY", price: 24999 },
  ];

  for (const p of plans) {
    await prisma.pricingPlan.upsert({
      where: { plan_interval: { plan: p.plan, interval: p.interval } },
      update: { price: p.price, isActive: true },
      create: { ...p, isActive: true },
    });
  }

  console.log("Seeded pricing plans:", plans.length);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
