// All monetary amounts in this app are whole AMD (dram) integers —
// Armenia has no smaller unit in everyday use, so there's no cents math.

export function formatAmd(amount: number): string {
  return new Intl.NumberFormat("hy-AM", {
    style: "currency",
    currency: "AMD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calcPlatformFee(totalAmd: number, feePercent: number): number {
  return Math.round(totalAmd * (feePercent / 100));
}
