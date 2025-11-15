// Calculate federal tax withholding
// TODO: Implement accurate federal tax calculations based on filing status, allowances, tax brackets

export function calculateFederal(taxableIncome, settings) {
  // For now, use simple percentage from settings
  // This will be replaced with accurate calculations based on:
  // - Filing status (single, married, etc.)
  // - Allowances/exemptions
  // - Tax brackets and withholding tables
  const taxRate = settings.taxRate || 20;
  const federalTax = taxableIncome * (taxRate / 100);
  
  return {
    federalTax
  };
}

