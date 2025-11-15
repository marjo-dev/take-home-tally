// Calculate take-home amount (net + cashNet)

export function calculateTakeHome(netIncome, cashNet) {
  const takeHome = netIncome + cashNet.cashNet;
  
  return {
    takeHome
  };
}

