/**
 * Centralized Indian Rupee (INR - ₹) Currency Formatter
 * Complies with Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * Formats any numeric value into Indian Rupee currency notation.
 * e.g., 5499 -> "₹5,499", 125000 -> "₹1,25,000"
 */
export function formatINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return inrFormatter.format(0);
  }
  return inrFormatter.format(Number(amount));
}

export default formatINR;
