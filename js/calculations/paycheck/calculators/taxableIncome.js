// Calculate taxable income (gross - pre-tax deductions)
// Pre-tax deductions reduce the amount subject to income tax

export function calculateTaxableIncome(gross, preTax) {
  // Subtract all pre-tax deductions (traditional 401k, other deductions)
  const taxableIncome = gross - preTax.preTaxTotal;
  
  return {
    taxableIncome
  };
}

