import { cookies } from 'next/headers'

export default function TermsPage() {
  const cookieStore = cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value as 'en' | 'es' || 'en'

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <h1 className="text-3xl font-black text-primary mb-6">
        {locale === 'es' ? 'Términos y Condiciones' : 'Terms & Conditions'}
      </h1>

      <div className="space-y-8 text-gray-700">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {locale === 'es' ? '1. Responsabilidad y Rol de Intermediario' : '1. Liability & Intermediary Role'}
          </h2>
          <p>
            {locale === 'es'
              ? 'D-Fyo actúa exclusivamente como un intermediario entre el usuario, la plataforma de compras (ej. Amazon), y el courier internacional final (Liberty Express). D-Fyo no es responsable por retrasos, daños o pérdidas causadas por servicios de terceros.'
              : 'D-Fyo acts exclusively as an intermediary between the user, the purchasing platform (e.g., Amazon), and the final international courier (Liberty Express, etc.). D-Fyo is not liable for delays, damages, or losses caused by third-party services.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {locale === 'es' ? '2. Seguro' : '2. Insurance'}
          </h2>
          <p>
            {locale === 'es'
              ? 'Todos los envíos incluyen cobertura básica hasta un 10% del valor declarado. Para una cobertura completa del 100%, los usuarios deben declarar el valor y pagar una tarifa adicional de seguro del 2% antes del envío.'
              : 'All shipments include basic coverage up to 10% of the declared value. For full 100% coverage, users must declare the value and pay an additional 2% insurance fee prior to shipping.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {locale === 'es' ? '3. Validez de la Tasa de Cambio' : '3. Exchange Rate Validity'}
          </h2>
          <p>
            {locale === 'es'
              ? 'La tasa de cambio en Bolívares (VES) mostrada al finalizar la compra está garantizada por exactamente 2 horas después de generada la orden. Si el pago no es verificado en esta ventana, la tasa será ajustada al valor de mercado actual.'
              : 'The Bolívares (VES) exchange rate displayed at checkout is guaranteed for exactly 2 hours after the order is generated. If payment is not verified within this window, the rate will be adjusted to the current market value.'}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {locale === 'es' ? '4. Artículos Prohibidos' : '4. Prohibited Items'}
          </h2>
          <p>
            {locale === 'es'
              ? 'D-Fyo cumple con las leyes internacionales de envío. Los siguientes artículos están estrictamente prohibidos y no serán enviados: Líquidos inflamables, explosivos, materiales corrosivos, armas de fuego, municiones, efectivo, y cualquier bien ilegal bajo la ley de EE.UU. o Venezuela.'
              : 'D-Fyo complies with international shipping laws. The following items are strictly prohibited and will not be shipped: Flammable liquids, explosives, corrosive materials, firearms, ammunition, cash, and any illegal goods under US or Venezuelan law.'}
          </p>
        </section>
      </div>
    </div>
  );
}
