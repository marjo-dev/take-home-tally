// Calculate cash tips - tip-outs (allows negative values)

export function calculateCashNet(entry) {
  const cashTips = entry.cashTips || 0;
  const tipOuts = entry.tipOuts || 0;
  const cashNet = cashTips - tipOuts;
  
  return {
    cashNet
  };
}

