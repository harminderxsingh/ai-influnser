export function detectCountryCode() {
  return "US";
}

export function convertUsdPrice(usdAmount, currency) {
  return parseFloat(parseFloat(usdAmount || 0).toFixed(2));
}

export function formatPrice(usdAmount, currency) {
  const converted = convertUsdPrice(usdAmount, currency);
  return `$${converted.toFixed(2)}`;
}

export function withCountry(payload = {}) {
  return payload;
}
