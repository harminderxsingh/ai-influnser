import React, { createContext, useContext, useCallback } from "react";
import {
  detectCountryCode,
  formatPrice as formatPriceUtil,
  convertUsdPrice,
} from "../utils/currency";

const CurrencyContext = createContext(null);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [country, setCountryState] = React.useState(detectCountryCode);

  const currency = React.useMemo(() => {
    if (country === "IN") {
      return {
        symbol: "₹",
        code: "INR",
        rate: 85,
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
  }, [country]);

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
