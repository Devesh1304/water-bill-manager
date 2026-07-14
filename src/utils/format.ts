export function formatINR(amount: number, decimals = 2): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const sign = amount < 0 ? '-' : '';
  return `${sign}₹${formatted}`;
}

export function currentBillingMonth(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function shiftBillingMonth(monthStr: string, delta: number): string {
  const parts = monthStr.split(' ');
  const year = parseInt(parts[parts.length - 1], 10);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthIndex = monthNames.indexOf(parts[0]);
  const d = new Date(year, monthIndex + delta, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
