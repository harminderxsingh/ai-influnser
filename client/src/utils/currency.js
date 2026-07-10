export function detectCountryCode() {
  const savedCountry = localStorage.getItem("country_code");
  if (savedCountry) return savedCountry.toUpperCase();

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const locale = navigator.language || "";

  if (
    timezone === "Asia/Kolkata" ||
    timezone === "Asia/Calcutta" ||
    locale.toUpperCase().endsWith("-IN")
  ) {
    return "IN";
  }

  return "US";
}

export function convertUsdPrice(usdAmount, currency) {
  const rate = parseFloat(currency?.rate || 1);
  return parseFloat((parseFloat(usdAmount || 0) * rate).toFixed(2));
}

export function formatPrice(usdAmount, currency) {
  const converted = convertUsdPrice(usdAmount, currency);
  const symbol = currency?.symbol || "$";
  return `${symbol}${converted.toFixed(2)}`;
}

export function withCountry(payload = {}) {
  return {
    ...payload,
    country: detectCountryCode(),
  };
}
