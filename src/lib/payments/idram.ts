import crypto from "node:crypto";
import type { CreatePaymentInput, CreatePaymentResult, PaymentProvider } from "./types";

/**
 * ⚠️ UNVERIFIED SCAFFOLD — do not go live on this without checking against
 * the current official Idram merchant integration guide.
 *
 * This mirrors the redirect-based "EDP_*" checkout flow that Idram (idram.am)
 * has historically documented for merchants (the same hosted page lets the
 * customer pay from their Idram wallet balance OR a bound Visa/Mastercard,
 * so one integration covers both payment methods this app wants to offer).
 * The exact field names, hash/checksum algorithm, endpoint URL, and webhook
 * payload can change or vary by merchant contract — Idram issues a PDF
 * integration guide and merchant credentials when you sign the merchant
 * agreement. Update this file against that document before enabling
 * PAYMENTS_MODE=idram.
 *
 * Expected shape once confirmed:
 *  1. createPayment() redirects the customer to Idram's hosted checkout
 *     with the merchant account, amount, and a bill/order reference.
 *  2. Idram calls your webhook twice:
 *     - a "precheck" call to confirm the order reference is valid/payable
 *     - a final call with the transaction result, which your webhook
 *       handler must acknowledge (historically by responding with the
 *       literal text "OK") for the payment to be marked complete.
 *  3. The customer's browser is separately redirected back to `returnUrl`.
 *
 * See src/app/api/webhooks/idram/route.ts for the webhook side of this.
 */

const CHECKOUT_BASE_URL =
  process.env.IDRAM_API_BASE_URL || "https://banking.idram.am/Payment/GetPayment";

export class IdramProvider implements PaymentProvider {
  private merchantAccount: string;
  private secretKey: string;

  constructor() {
    const merchantAccount = process.env.IDRAM_MERCHANT_ID;
    const secretKey = process.env.IDRAM_SECRET_KEY;
    if (!merchantAccount || !secretKey) {
      throw new Error(
        "IDRAM_MERCHANT_ID / IDRAM_SECRET_KEY are not set — request merchant credentials from Idram first."
      );
    }
    this.merchantAccount = merchantAccount;
    this.secretKey = secretKey;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const params = new URLSearchParams({
      EDP_LANGUAGE: "AM",
      EDP_REC_ACCOUNT: this.merchantAccount,
      EDP_DESCRIPTION: input.description,
      EDP_AMOUNT: String(input.amountAmd),
      EDP_BILL_NO: input.paymentId,
      EDP_SUCCESS_URL: input.returnUrl,
      EDP_FAIL_URL: input.returnUrl,
    });

    return { kind: "redirect", url: `${CHECKOUT_BASE_URL}?${params.toString()}` };
  }
}

/**
 * Verifies the checksum on an inbound webhook call from Idram.
 * ⚠️ The concatenation order/algorithm below is a placeholder — confirm the
 * real formula against Idram's integration guide before trusting it.
 */
export function verifyIdramChecksum(fields: {
  billNo: string;
  amountAmd: string;
  payerAccount: string;
  checksum: string;
}): boolean {
  const secretKey = process.env.IDRAM_SECRET_KEY;
  if (!secretKey) return false;

  const expected = crypto
    .createHash("md5")
    .update(`${fields.billNo}:${fields.amountAmd}:${secretKey}`)
    .digest("hex");

  return expected.toLowerCase() === fields.checksum.toLowerCase();
}
