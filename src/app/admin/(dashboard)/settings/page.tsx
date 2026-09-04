import { requireBusiness } from "@/lib/current-business";
import { setOrderingEnabledAction, setServiceFeePercentAction } from "./actions";

export default async function SettingsPage() {
  const business = await requireBusiness();

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
      </div>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="text-sm font-medium text-white">Ordering</h2>
        <p className="mt-1 text-sm text-neutral-400">
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
            className="h-4 w-4 accent-orange-500"
          />
          <label htmlFor="orderingEnabled" className="text-sm text-neutral-300">
            Allow customers to order after scanning
          </label>
          <button
            type="submit"
            className="ml-auto rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black"
          >
            Save
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="text-sm font-medium text-white">Service fee</h2>
        <p className="mt-1 text-sm text-neutral-400">
          A percentage added on top of the items total on every payment — the standard
          &quot;սպասարկման վճար&quot; charged at HoReCa venues in Armenia. Shown to customers
          separately from the tip, and goes to you, not the platform.
        </p>
        <form action={setServiceFeePercentAction} className="mt-4 flex items-center gap-2">
          <input
            type="number"
            id="serviceFeePercent"
            name="serviceFeePercent"
            min={0}
            max={30}
            step={0.5}
            defaultValue={business.serviceFeePercent}
            className="w-24 rounded-md border border-neutral-700 bg-black px-3 py-2 text-white"
          />
          <span className="text-sm text-neutral-400">%</span>
          <button
            type="submit"
            className="ml-auto rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black"
          >
            Save
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="text-sm font-medium text-white">Platform fee</h2>
        <p className="mt-1 text-sm text-neutral-400">
          {business.feePercent}% of each transaction, deducted at payout. Contact us to discuss
          your rate.
        </p>
      </section>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="text-sm font-medium text-white">Idram payouts</h2>
        <p className="mt-1 text-sm text-neutral-400">
          {business.idramMerchantId
            ? `Connected — payouts settle to Idram account ${business.idramMerchantId}.`
            : "Not connected yet. We'll reach out to set up your Idram merchant account and payout schedule."}
        </p>
      </section>
    </div>
  );
}
