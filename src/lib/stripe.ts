import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-04-22.dahlia",
});

export const STRIPE_PRICES: Record<string, string> = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
  ELITE_MONTHLY: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID ?? "",
  ELITE_YEARLY: process.env.STRIPE_ELITE_YEARLY_PRICE_ID ?? "",
};

export const PLANS = {
  FREE: { id: "FREE", label: "Free", price: 0 },
  PRO_MONTHLY: { id: "PRO", label: "PRO Monthly", price: 999, interval: "MONTHLY" },
  PRO_YEARLY: { id: "PRO", label: "PRO Yearly", price: 9999, interval: "YEARLY" },
  ELITE_MONTHLY: { id: "ELITE", label: "Elite Monthly", price: 2499, interval: "MONTHLY" },
  ELITE_YEARLY: { id: "ELITE", label: "Elite Yearly", price: 24999, interval: "YEARLY" },
} as const;
