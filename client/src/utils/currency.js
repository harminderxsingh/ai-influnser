export function formatPrice(usdAmount, currency) {
  const amount = parseFloat((parseFloat(usdAmount || 0) || 0).toFixed(2));
  const symbol = currency?.symbol || "$";
  return `${symbol}${amount.toFixed(2)}`;
}

export function convertUsdPrice(usdAmount) {
  return parseFloat((parseFloat(usdAmount || 0) || 0).toFixed(2));
}
