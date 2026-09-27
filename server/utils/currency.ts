/**
 * Server-side Centralized Indian Rupee (INR - ₹) Currency Formatter
 * Complies with Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return inrFormatter.format(0);
  }
  return inrFormatter.format(Number(amount));
}

export default formatINR;
