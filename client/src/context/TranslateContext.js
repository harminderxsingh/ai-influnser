import React from "react";
// import { data } from '../utils/en'

export const TranslateContext = React.createContext(null);

export const TranslateProvider = (props) => {
  // const url = process.env.REACT_APP_BASE_URL
  const [data, setData] = React.useState({});

  return (
    <TranslateContext.Provider value={{ lang: data, data: data, setData }}>
      {props.children}
    </TranslateContext.Provider>
  );
};
