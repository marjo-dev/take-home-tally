// Aggregate weekly summaries into YTD totals and averages

export function calculateYTD(weeklySummaries) {
  if (!weeklySummaries || weeklySummaries.length === 0) {
    return {
      totalWeeks: 0,
      totals: {
        hours: 0,
        gross: 0,
        tax: 0,
        net: 0,
        retirement: 0,
        takeHome: 0,
        tipOuts: 0
      },
      averages: {
        hours: 0,
        gross: 0,
        tax: 0,
        net: 0,
        retirement: 0,
        takeHome: 0,
        tipOuts: 0
      }
    };
  }

  const totals = {
    hours: 0,
    gross: 0,
    tax: 0,
    net: 0,
    retirement: 0,
    takeHome: 0,
    tipOuts: 0
  };

  for (const week of weeklySummaries) {
    const t = week.totals;
    totals.hours += t.hours;
    totals.gross += t.gross;
    totals.tax += t.tax;
    totals.net += t.net;
    totals.retirement += t.retirement;
    totals.takeHome += t.takeHome;
    totals.tipOuts += t.tipOuts;
  }

  const weekCount = weeklySummaries.length;
  const averages = {
    hours: totals.hours / weekCount,
    gross: totals.gross / weekCount,
    tax: totals.tax / weekCount,
    net: totals.net / weekCount,
    retirement: totals.retirement / weekCount,
    takeHome: totals.takeHome / weekCount,
    tipOuts: totals.tipOuts / weekCount
  };

  return {
    totalWeeks: weekCount,
    totals,
    averages
  };
}

