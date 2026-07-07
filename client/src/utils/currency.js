export function detectCountryCode() {
  try {
    const stored = localStorage.getItem("user_country");
    if (stored) return String(stored).toUpperCase();
  } catch (_) {}

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  if (/Asia\/(Kolkata|Calcutta)/i.test(tz)) return "IN";

  const locale = navigator.language || "";
  if (/-IN$/i.test(locale) || /^hi(-|$)/i.test(locale)) return "IN";

  return "US";
}

export function convertUsdPrice(usdAmount, currency) {
  const amount = parseFloat(usdAmount || 0) * (currency?.rate || 1);
  if (currency?.code === "INR") return Math.round(amount);
  return parseFloat(amount.toFixed(2));
}

export function formatPrice(usdAmount, currency) {
  const converted = convertUsdPrice(usdAmount, currency);
  if (currency?.code === "INR") {
    return `₹${converted.toLocaleString("en-IN")}`;
  }
  return `$${converted.toFixed(2)}`;
}

export function withCountry(payload = {}) {
  return { ...payload, country: detectCountryCode() };
}
