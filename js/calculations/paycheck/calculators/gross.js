// Calculate gross income (hourly pay + credit card tips)

export function calculateGross(entry, settings) {
  const roleRate = entry.settingsSnapshot?.roleRate ?? settings.roles[entry.role] ?? 0;
  const hourlyPay = entry.hours * roleRate;
  const tips = entry.tips || 0;
  const gross = hourlyPay + tips;
  
  return {
    gross,
    hourlyPay,
    tips
  };
}

