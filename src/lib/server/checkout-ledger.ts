import { listDiscounts, upsertDiscount } from "@/lib/server/store";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function undoPendingDiscountUsage(code: string | undefined, email: string) {
  if (!code) return;
  const normalized = normalizeEmail(email);
  const discounts = await listDiscounts();
  const discount = discounts.find((d) => d.code.toLowerCase() === code.toLowerCase());
  if (!discount || !discount.usedEmails.includes(normalized)) return;

  await upsertDiscount(
    {
      ...discount,
      usedCount: Math.max(0, discount.usedCount - 1),
      usedEmails: discount.usedEmails.filter((e) => e.toLowerCase() !== normalized),
    },
    "checkout-system"
  );
}

export async function recordDiscountUsageOnce(code: string | undefined, email: string) {
  if (!code) return;
  const normalized = normalizeEmail(email);
  const discounts = await listDiscounts();
  const discount = discounts.find((d) => d.code.toLowerCase() === code.toLowerCase());
  if (!discount || discount.usedEmails.some((e) => e.toLowerCase() === normalized)) return;

  await upsertDiscount(
    {
      ...discount,
      usedCount: discount.usedCount + 1,
      usedEmails: [...discount.usedEmails, normalized],
    },
    "checkout-system"
  );
}
