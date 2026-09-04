import type { CreatePaymentInput, CreatePaymentResult, PaymentProvider } from "./types";

/**
 * Local/demo provider: no real money moves. Marks the payment as
 * succeeded immediately so you can build and test the whole item-split
 * + tip + bill-closing flow before Idram merchant credentials exist.
 *
 * Swap PAYMENTS_MODE=idram in .env once IdramProvider (see idram.ts) is
 * wired up to real credentials.
 */
export class MockPaymentProvider implements PaymentProvider {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    return {
      kind: "succeeded",
      providerTransactionId: `MOCK-${input.paymentId}`,
    };
  }
}
