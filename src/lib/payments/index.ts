import type { PaymentProvider } from "./types";
import { MockPaymentProvider } from "./mock";

export * from "./types";

let provider: PaymentProvider | undefined;

export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;

  provider = new MockPaymentProvider();
  return provider;
}

/**
 * Async variant used where Idram mode may be active — dynamic import keeps
 * a missing IDRAM_* env var from crashing mock-mode runs at module load.
 */
export async function getPaymentProviderAsync(): Promise<PaymentProvider> {
  if (process.env.PAYMENTS_MODE === "idram") {
    const { IdramProvider } = await import("./idram");
    return new IdramProvider();
  }
  return getPaymentProvider();
}
