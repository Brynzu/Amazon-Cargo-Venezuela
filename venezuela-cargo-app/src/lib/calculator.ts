export interface CostBreakdown {
  amazonPrice: number;
  usTax: number;
  priceWithTax: number;
  serviceCommission: number;
  handlingFee: number;
  totalCost: number;
}

export function calculateTotalCost(amazonPrice: number): CostBreakdown {
  const US_TAX_RATE = 0.07;
  const SERVICE_COMMISSION_RATE = 0.15;
  const HANDLING_FEE = 5;

  const usTax = amazonPrice * US_TAX_RATE;
  const priceWithTax = amazonPrice + usTax;
  const serviceCommission = priceWithTax * SERVICE_COMMISSION_RATE;
  const totalCost = priceWithTax + serviceCommission + HANDLING_FEE;

  return {
    amazonPrice: Number(amazonPrice.toFixed(2)),
    usTax: Number(usTax.toFixed(2)),
    priceWithTax: Number(priceWithTax.toFixed(2)),
    serviceCommission: Number(serviceCommission.toFixed(2)),
    handlingFee: HANDLING_FEE,
    totalCost: Number(totalCost.toFixed(2)),
  };
}
