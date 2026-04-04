import { differenceInDays } from "date-fns";

export function isNeedsCare(lastCare: Date | null): boolean {
  if (!lastCare) return true; // Chưa bao giờ chăm sóc
  return differenceInDays(new Date(), lastCare) > 15;
}

export function getDaysSinceLastCare(lastCare: Date | null): number {
  if (!lastCare) return Infinity;
  return differenceInDays(new Date(), lastCare);
}
