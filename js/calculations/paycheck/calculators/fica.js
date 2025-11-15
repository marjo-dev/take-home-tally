// Calculate FICA (Social Security + Medicare)
// TODO: Implement accurate FICA calculations based on current year rates and wage base limits

export function calculateFICA(taxableIncome, settings) {
  // For now, FICA is included in the simple tax rate
  // This will be replaced with accurate calculations:
  // - Social Security: 6.2% up to wage base limit
  // - Medicare: 1.45% (no limit for regular, 0.9% additional for high earners)
  const socialSecurity = 0; // Placeholder
  const medicare = 0; // Placeholder
  const ficaTotal = 0; // Placeholder - currently included in tax rate
  
  return {
    socialSecurity,
    medicare,
    ficaTotal
  };
}

