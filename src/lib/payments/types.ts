export type CreatePaymentInput = {
  /** Our internal Payment.id — pass through as the provider's order/bill reference. */
  paymentId: string;
  amountAmd: number;
  description: string;
  /** Where the customer's browser should land after leaving the provider's page. */
  returnUrl: string;
};

export type CreatePaymentResult =
  | { kind: "redirect"; url: string }
  | { kind: "succeeded"; providerTransactionId: string };

export interface PaymentProvider {
  /** Build a checkout for this payment. Either a URL to redirect the customer to,
   *  or (mock provider only) an immediate success. */
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
}
