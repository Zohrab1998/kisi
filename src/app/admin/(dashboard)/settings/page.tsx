import { requireBusiness } from "@/lib/current-business";
import { setOrderingEnabledAction } from "./actions";

export default async function SettingsPage() {
  const business = await requireBusiness();

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Settings</h1>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-medium text-neutral-900">Ordering</h2>
        <p className="mt-1 text-sm text-neutral-500">
          When enabled, customers can place an order from their phone after scanning the table
          QR — before staff have opened a bill. When disabled, the QR only shows payment for
          bills your staff have entered.
        </p>
        <form action={setOrderingEnabledAction} className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="orderingEnabled"
            name="orderingEnabled"
            defaultChecked={business.orderingEnabled}
            className="h-4 w-4"
          />
          <label htmlFor="orderingEnabled" className="text-sm text-neutral-700">
            Allow customers to order after scanning
          </label>
          <button
            type="submit"
            className="ml-auto rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Save
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-medium text-neutral-900">Platform fee</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {business.feePercent}% of each transaction, deducted at payout. Contact us to discuss
          your rate.
        </p>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-medium text-neutral-900">Idram payouts</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {business.idramMerchantId
            ? `Connected — payouts settle to Idram account ${business.idramMerchantId}.`
            : "Not connected yet. We'll reach out to set up your Idram merchant account and payout schedule."}
        </p>
      </section>
    </div>
  );
}
