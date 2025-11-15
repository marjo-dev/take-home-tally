// Calculate state tax withholding
// TODO: Implement accurate state tax calculations based on state, filing status, allowances

export function calculateState(taxableIncome, settings) {
  // For now, state tax is included in the simple tax rate
  // This will be replaced with accurate calculations based on:
  // - State code
  // - State-specific tax brackets
  // - Filing status and allowances
  const stateTax = 0; // Placeholder - currently included in tax rate
  
  return {
    stateTax
  };
}

