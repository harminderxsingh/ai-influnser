import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { GlobalContext } from "./GlobalContext";
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
  const { hitAxios } = useContext(GlobalContext);
  const [country, setCountry] = useState(() => detectCountryCode());
  const [currency, setCurrency] = useState({
    symbol: "$",
    code: "USD",
    rate: 1,
    base: "USD",
    country: "US",
  });
  const [ready, setReady] = useState(false);

  const loadCurrency = useCallback(
    async (countryCode) => {
      const res = await hitAxios({
        path: `/api/payment/currency?country=${countryCode}`,
        post: false,
        admin: false,
        showLoading: false,
        showSnackbar: false,
      });
      if (res?.data?.success) {
        setCurrency(res.data.data);
        try {
          localStorage.setItem("user_country", countryCode);
        } catch (_) {}
      }
      setReady(true);
    },
    [hitAxios],
  );

  useEffect(() => {
    loadCurrency(country);
  }, [country, loadCurrency]);

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
        ready,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export { CurrencyContext };
export default CurrencyProvider;
