import React, { createContext, useContext, useCallback } from "react";
import axios from "axios";
import {
  detectCountryCode,
  formatPrice as formatPriceUtil,
  convertUsdPrice,
} from "../utils/currency";

const DEFAULT_USD_TO_INR = 95;

const CurrencyContext = createContext(null);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

function parseUsdToInrRate(value) {
  const rate = parseFloat(value);
  return Number.isFinite(rate) && rate > 1 ? rate : DEFAULT_USD_TO_INR;
}

export const CurrencyProvider = ({ children }) => {
  const [country, setCountryState] = React.useState(detectCountryCode);
  const [usdToInrRate, setUsdToInrRate] = React.useState(DEFAULT_USD_TO_INR);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/api/web/get_web_public`,
        );
        if (!cancelled && res?.data?.success) {
          setUsdToInrRate(parseUsdToInrRate(res.data.data?.currency_exchange_rate));
        }
      } catch (_) {
        // keep default rate
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currency = React.useMemo(() => {
    if (country === "IN") {
      return {
        symbol: "₹",
        code: "INR",
        rate: usdToInrRate,
        base: "USD",
        country: "IN",
      };
    }

    return {
      symbol: "$",
      code: "USD",
      rate: 1,
      base: "USD",
      country: country || "US",
    };
  }, [country, usdToInrRate]);

  const setCountry = useCallback((code) => {
    const nextCountry = String(code || "US").toUpperCase();
    localStorage.setItem("country_code", nextCountry);
    setCountryState(nextCountry);
  }, []);

  const formatPrice = useCallback(
    (usdAmount) => formatPriceUtil(usdAmount, currency),
    [currency],
  );

  const convertPrice = useCallback(
    (usdAmount) => convertUsdPrice(usdAmount, currency),
    [currency],
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        country,
        setCountry,
        formatPrice,
        convertPrice,
        ready: true,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export { CurrencyContext };
export default CurrencyProvider;
