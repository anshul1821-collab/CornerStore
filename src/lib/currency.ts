/**
 * USD Currency Formatting & Helpers for Corner Store Simulator
 * Ensures consistent $1.00, $5.00, $10.00 representation across all game screens.
 */

export function formatUSD(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "$0.00";
  }
  return `$${amount.toFixed(2)}`;
}

export function formatUSDShort(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "$0";
  }
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}
