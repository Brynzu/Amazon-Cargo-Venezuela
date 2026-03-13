export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <h1 className="text-3xl font-black text-primary mb-6">Terms & Conditions</h1>

      <div className="space-y-8 text-gray-700">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">1. Liability & Intermediary Role</h2>
          <p>
            CargoBox acts exclusively as an intermediary between the user, the purchasing platform (e.g., Amazon), and the final international courier (Liberty Express, Zoom, Tealca, etc.). CargoBox is not liable for delays, damages, or losses caused by third-party services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">2. Insurance</h2>
          <p>
            All shipments include basic coverage up to 10% of the declared value. For full 100% coverage, users must declare the value and pay an additional 2% insurance fee prior to shipping.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">3. Exchange Rate Validity</h2>
          <p>
            The Bolívares (VES) exchange rate displayed at checkout is guaranteed for exactly 2 hours after the order is generated. If payment is not verified within this window, the rate will be adjusted to the current market value.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">4. Prohibited Items</h2>
          <p>
            CargoBox complies with international shipping laws. The following items are strictly prohibited and will not be shipped: Flammable liquids, explosives, corrosive materials, firearms, ammunition, cash, and any illegal goods under US or Venezuelan law.
          </p>
        </section>
      </div>
    </div>
  );
}
