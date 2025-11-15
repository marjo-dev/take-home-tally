// Calculate net income (gross - all deductions)
// Deductions include: pre-tax deductions, post-tax retirement, and taxes

export function calculateNetIncome(gross, preTax, retirement, fica, federal, state) {
  // Sum all deductions
  const totalDeductions = 
    preTax.preTaxTotal + // Pre-tax: traditional 401k, other deductions
    retirement.roth401k + // Post-tax: Roth 401k
    fica.ficaTotal +
    federal.federalTax +
    state.stateTax;
  
  const netIncome = gross - totalDeductions;
  
  return {
    netIncome
  };
}

