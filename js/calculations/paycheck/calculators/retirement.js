// Calculate retirement contributions and employer match
// Note: Traditional 401k (pre-tax) is handled in preTax.js - do NOT return k401 here
// 
// IMPORTANT: Only employee contributions (k401, roth401k) are deducted from paycheck.
// employerMatch and totalRetirement are informational/aggregate data only.

export function calculateRetirement(gross, preTax, settings) {
  const k401Rate = settings.k401Rate || 0;
  const roth401kRate = settings.roth401kRate || 0;
  const employerMatch = settings.employerMatch || 0;
  
  // Traditional 401k is pre-tax (handled in preTax.js, deducted from paycheck)
  // Reference it from preTax but don't return it - preTax.js is the source of truth
  const k401 = preTax.k401;
  
  // Roth 401k is post-tax (deducted from paycheck after taxes)
  const roth401k = gross * (roth401kRate / 100);
  
  // Total employee contributions (pre-tax + post-tax) - these ARE deducted from paycheck
  const totalContributions = k401 + roth401k;
  
  // Employer match - NOT deducted from paycheck, informational only
  // Only calculate if user has 401k or Roth 401k contributions
  const hasRetirementContribution = k401Rate > 0 || roth401kRate > 0;
  const employerMatchAmount = hasRetirementContribution ? gross * (employerMatch / 100) : 0;
  
  // Total retirement value (employee contributions + employer match) - informational only
  const totalRetirement = totalContributions + employerMatchAmount;
  
  return {
    // Note: k401 is NOT returned here - it comes from preTax.js (single source of truth)
    roth401k, // Post-tax employee contribution (deducted from paycheck)
    totalContributions, // Total employee contributions (deducted from paycheck)
    employerMatch: employerMatchAmount, // Employer match (NOT deducted, informational only)
    totalRetirement // Total retirement value (NOT deducted, informational/aggregate only)
  };
}

