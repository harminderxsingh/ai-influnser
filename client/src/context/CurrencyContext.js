import React, { createContext, useContext, useCallback } from "react";
import {
  formatPrice as formatPriceUtil,
  convertUsdPrice,
} from "../utils/currency";

const USD = {
  symbol: "$",
  code: "USD",
  rate: 1,
  base: "USD",
  country: "US",
};

const CurrencyContext = createContext(null);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const formatPrice = useCallback(
    (usdAmount) => formatPriceUtil(usdAmount, USD),
    [],
  );

  const convertPrice = useCallback(
    (usdAmount) => convertUsdPrice(usdAmount, USD),
    [],
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency: USD,
        country: "US",
        setCountry: () => {},
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
