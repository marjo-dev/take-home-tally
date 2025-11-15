// Calculate pre-tax deductions (reduces taxable income)
// Pre-tax deductions: traditional 401k, other deductions (if applicable)

export function calculatePreTax(gross, settings) {
  const k401Rate = settings.k401Rate || 0;
  const otherDeductionsRate = settings.otherDeductions || 0;
  
  const k401 = gross * (k401Rate / 100);
  const otherDeductions = gross * (otherDeductionsRate / 100);
  const preTaxTotal = k401 + otherDeductions;
  
  return {
    k401,
    otherDeductions,
    preTaxTotal
  };
}

